import React from 'react';
import { AcmChartGroup,
    AcmDonutChart,
    AcmLoadingPage,
    AcmPage,
    AcmPageHeader,
    AcmOverviewProviders,
    AcmSummaryList,
    Provider,
} from '@open-cluster-management/ui-components'
import { consoleClient } from '../../console-sdk/console-client'
import { useGetOverviewQuery } from '../../console-sdk/console-sdk'
import { useSearchResultCountQuery } from '../../search-sdk/search-sdk'
import { searchClient } from '../../search-sdk/search-client';

// TODO: Need to verify correct spelling for all these labels.
function mapProviderFromLabel(provider: string): Provider {
    switch (provider) {
        case 'Amazon':
            return Provider.aws
        case 'Azure':
            return Provider.azure
        case 'Baremetal':
            return Provider.baremetal
        case 'Google':
            return Provider.gcp
        case 'IBM':
            return Provider.ibm
        case 'RedHat':
            return Provider.redhatcloud
        case 'VMware':
            return Provider.vmware
        default:
            return Provider.other
    }
}

function getClusterSummary(clusters: any) {
    const clusterSummary = clusters.reduce((prev: any, curr: any , index: number) => {
        // Data for Providers section.
        const cloud = curr.metadata?.labels?.cloud || 'other'
        const provider = prev.providers.find((p: any) => p.provider === mapProviderFromLabel(cloud))
        if (provider) {
            provider.clusterCount = provider.clusterCount + 1
        } else {
            prev.providers.push({ provider: mapProviderFromLabel(cloud),
                clusterCount: 1,
                onClick: ()=>{console.log(`Execute action for cluster provider: ${cloud}`)}})
        }

        // Data for Summary section.
        prev.kubernetesTypes.add(curr.metadata.labels.vendor)
        prev.regions.add(curr.metadata.labels.region)
        
        // Data for Cluster status pie chart.
        if (curr.status === 'ok'){
            prev.ready = prev.ready + 1
        } else{
            prev.offline = prev.offline + 1
        }
        return prev
    }, { kubernetesTypes: new Set(), regions: new Set(), ready: 0, offline: 0, providerCounts: {}, providers: [] })

    return clusterSummary
}

const searchInput = [
    { keywords: [], filters: [{property: 'kind', values:['node']}]},
    { keywords: [], filters: [{property: 'kind', values:['pod']}]},
    { keywords: [], filters: [{property: 'kind', values:['pod']}, { property: 'status', values:['Running', 'Completed']} ]},
    { keywords: [], filters: [{property: 'kind', values:['pod']}, { property: 'status', values:['Pending', 'ContainerCreating', 'Waiting', 'Terminating']} ]},
    { keywords: [], filters: [{property: 'kind', values:['pod']}, { property: 'status', values:['Failed', 'CrashLoopBackOff', 'ImagePullBackOff', 'Terminated', 'OOMKilled', 'Unknown']} ]},
    { keywords: [], filters: [{property: 'apigroup', values:['policy.open-cluster-management.io']}, {property: 'kind', values:['policy']}, { property: 'compliant', values:['Compliant']} ]},
    { keywords: [], filters: [{property: 'apigroup', values:['policy.open-cluster-management.io']}, {property: 'kind', values:['policy']}, { property: 'compliant', values:['NonCompliant']} ]},
]

export default function OverviewPage() {
    const { data, loading, error } = useGetOverviewQuery({client: consoleClient})
    const { data: searchData, loading: searchLoading, error: searchError} = useSearchResultCountQuery({ client: searchClient, variables: {input: searchInput }})
    const searchResult = searchData?.searchResult || []

    if (error || searchError){
        // TODO: need better error message.
        return (<p>Error getting data.</p>)
    }

    const { kubernetesTypes, regions, ready, offline, providers } = getClusterSummary(data?.overview?.clusters || [])
    
    const summary = loading || searchLoading? [] : [
        { isPrimary: true, description: 'Applications', count: data?.overview?.applications?.length || 0, href: 'search?filters={"textsearch":"kind%3Aapplication"}' },
        { isPrimary: false, description: 'Clusters', count: data?.overview?.clusters?.length || 0, href: 'search?filters={"textsearch":"kind%3Acluster"}' },
        { isPrimary: false, description: 'Kubernetes type', count: kubernetesTypes.size },
        { isPrimary: false, description: 'Region', count: regions.size },
        { isPrimary: false, description: 'Nodes', count: searchResult[0]?.count || 0, href: '/search?filters={"textsearch":"kind%3Anode"}' },
        { isPrimary: false, description: 'Pods', count: searchResult[1]?.count || 0, href: '/search?filters={"textsearch":"kind%3Apod"}' },
    ]

    const podData = loading || searchLoading? [] : [
        { key: 'Running', value: searchResult[2]?.count || 0, isPrimary: true },
        { key: 'Pending', value: searchResult[3]?.count || 0 },
        { key: 'Failed', value: searchResult[4]?.count || 0, isDanger: true },
    ]

    const complianceData = loading || searchLoading? [] : [
        { key: 'Compliant', value: searchResult[5]?.count || 0, isPrimary: true },
        { key: 'Non-compliant', value: searchResult[6]?.count || 0, isDanger: true },
    ]

    const clusterData = loading || searchLoading? [] : [
        { key: 'Ready', value: ready, isPrimary: true },
        { key: 'Offline', value: offline, isDanger: true },
    ]

    return (
        <AcmPage>  
            <AcmPageHeader title="Overivew" />

            {/* TODO: Use material-ui styles instead of inline. */}
            {loading? 
            <div key="1" style={{ marginLeft: ".5rem" }}>
                <AcmLoadingPage />
            </div>
            :
            <div style={{ margin: "2rem 1rem 1rem 2rem" }}>
                <AcmOverviewProviders providers={providers} />
            </div>
            }
                      
            <div style={{ margin: "1rem 1rem 1rem 2rem" }}>
                {loading || searchLoading ?
                <AcmSummaryList key="loading" loading title="Summary" list={summary}/>
                :
                <AcmSummaryList title="Summary" list={summary}/>}
            </div>
        

            <div style={{ margin: "1rem 2rem 1rem 2rem" }}>
                {loading || searchLoading ?
                <AcmChartGroup>
                    <AcmDonutChart loading key="chart-loading-1" title="Cluster compliance" description="Overview of policy compliance status" data={[]} />
                    <AcmDonutChart loading key="chart-loading-2" title="Pods" description="Overview of pod count and status" data={[]} />
                    <AcmDonutChart loading key="chart-loading-3" title="Cluster status" description="Overview of cluster status" data={[]} />
                </AcmChartGroup>
                :
                <AcmChartGroup>
                    <AcmDonutChart title="Cluster compliance" description="Overview of policy compliance status" data={complianceData} />
                    <AcmDonutChart title="Pods" description="Overview of pod count and status" data={podData} />
                    <AcmDonutChart title="Cluster status" description="Overview of cluster status" data={clusterData} />
                </AcmChartGroup>}
            </div>
        </AcmPage>
    )
}