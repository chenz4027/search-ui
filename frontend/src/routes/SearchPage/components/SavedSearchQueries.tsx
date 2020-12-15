import React, { useState } from 'react'
import '@patternfly/react-core/dist/styles/base.css'
import { searchClient } from '../../../search-sdk/search-client'
import { useSavedSearchesQuery, useSearchResultCountQuery, UserSearch } from '../../../search-sdk/search-sdk'
import { convertStringToQuery } from '../search-helper'
import SuggestQueryTemplates from './SuggestedQueryTemplates'
import { AcmExpandableWrapper, AcmCountCard } from '@open-cluster-management/ui-components'
import { updateBrowserUrl } from '../urlQuery'
import { SaveAndEditSearchModal } from './Modals/SaveAndEditSearchModal'
import { DeleteSearchModal } from './Modals/DeleteSearchModal'
import { ShareSearchModal } from './Modals/ShareSearchModal'
import { PageSection } from '@patternfly/react-core'

function SearchResultCount(input: any, queries: any, suggestedQueryTemplates: any, setCurrentQuery: any): any {
    const { data, error, loading } = useSearchResultCountQuery({
        variables: { input: input },
        client: searchClient,
    })

    const [editSearch, setEditSearch] = useState(undefined)
    const [shareSearch, setShareSearch] = useState(undefined)
    const [deleteSearch, setDeleteSearch] = useState(undefined)

    if (loading) {
        return (
            <PageSection>
                <AcmExpandableWrapper withCount={false} expandable={false}>
                    <AcmCountCard loading />
                    <AcmCountCard loading />
                    <AcmCountCard loading />
                </AcmExpandableWrapper>
            </PageSection>
        )
    } else if (error || !data || !data.searchResult) {
        return null
    } else if (data && data.searchResult) {
        const savedQueriesResult = data.searchResult.slice(0, queries.length).map((query, index) => {
            return { ...query, ...queries[index] }
        })
        const suggestedQueriesResult = data.searchResult.slice(queries.length).map((query, index) => {
            return { ...query, ...suggestedQueryTemplates[index] }
        })
        return (
            <PageSection>
                <SaveAndEditSearchModal editSearch={editSearch} onClose={() => setEditSearch(undefined)} />
                <ShareSearchModal shareSearch={shareSearch} onClose={() => setShareSearch(undefined)} />
                <DeleteSearchModal deleteSearch={deleteSearch} onClose={() => setDeleteSearch(undefined)} />

                {savedQueriesResult.length > 0 && (
                    <AcmExpandableWrapper
                        maxHeight={'16rem'}
                        headerLabel={'Saved searches'}
                        withCount={true}
                        expandable={true}
                    >
                        {savedQueriesResult.map((query) => {
                            return (
                                <AcmCountCard
                                    key={query.id}
                                    cardHeader={{
                                        hasIcon: false,
                                        title: query.name,
                                        description: query.description,
                                        actions: [
                                            { text: 'Edit', handleAction: () => setEditSearch(query) },
                                            { text: 'Share', handleAction: () => setShareSearch(query) },
                                            { text: 'Delete', handleAction: () => setDeleteSearch(query) },
                                        ],
                                    }}
                                    onCardClick={() => {
                                        setCurrentQuery(query.searchText)
                                        updateBrowserUrl(query.searchText)
                                    }}
                                    count={query.count}
                                    countTitle="Results"
                                />
                            )
                        })}
                    </AcmExpandableWrapper>
                )}
                {suggestedQueriesResult.length > 0 && (
                    <AcmExpandableWrapper
                        headerLabel={'Suggested search templates'}
                        withCount={false}
                        expandable={false}
                    >
                        {suggestedQueriesResult.map((query) => {
                            return (
                                <AcmCountCard
                                    key={query.id}
                                    cardHeader={{
                                        hasIcon: true,
                                        title: query.name,
                                        description: query.description,
                                        actions: [{ text: 'Share', handleAction: () => setShareSearch(query) }],
                                    }}
                                    onCardClick={() => {
                                        setCurrentQuery(query.searchText)
                                        updateBrowserUrl(query.searchText)
                                    }}
                                    count={query.count}
                                    countTitle="Results"
                                />
                            )
                        })}
                    </AcmExpandableWrapper>
                )}
            </PageSection>
        )
    }
}

export default function SavedSearchQueries(props: { setCurrentQuery: React.Dispatch<React.SetStateAction<string>> }) {
    const { data } = useSavedSearchesQuery({
        client: searchClient,
    })
    const queries = data?.items ?? ([] as UserSearch[])
    // each query should contain ---- description, name, results = [], resultHeader
    const suggestedQueryTemplates = SuggestQueryTemplates?.templates ?? ([] as UserSearch[])
    // combine the suggested queries and saved queries
    const input = [
        ...queries.map((query) => convertStringToQuery(query!.searchText as string)),
        ...suggestedQueryTemplates.map((query: { searchText: string }) => convertStringToQuery(query.searchText)),
    ]
    return SearchResultCount(input, queries, suggestedQueryTemplates, props.setCurrentQuery)
}