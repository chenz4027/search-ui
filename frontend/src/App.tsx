/* istanbul ignore file */

import "@patternfly/react-core/dist/styles/base.css";
import { lazy } from 'react'
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom'

const SearchPage = lazy(() => import('./routes/SearchPage/SearchPage'))
const DetailsPage = lazy(() => import('./routes/DetailsPage/DetailsPage'))
const OverviewPage = lazy(() => import('./routes/Overview/OverviewPage'))

function App() {
    return (
        <Router>
            <Switch>
                {/* New UI Paths */}
                <Route path={'/overview'} component={OverviewPage} />
                <Route exact path={'/search'} component={SearchPage} />
                <Route path={'/resources'} component={DetailsPage} />

                {/* Old UI Redirects */}
                {process.env.ENABLE_REDIRECT ? <Redirect from={'/multicloud/overview'} to={'/overview'} /> : null}
                {process.env.ENABLE_REDIRECT ? <Redirect from={'/multicloud/search'} to={{ pathname: '/search', search: window.location.search }} /> : null}
                {process.env.ENABLE_REDIRECT ? <Redirect from={'/multicloud/details'} to={{ pathname: window.location.pathname.replace('/multicloud/details', '/resources') }} /> : null}

                {/* Redirect to base search page on all other paths */}
                <Route exact path="*">
                    <Redirect to={'/search'} />
                </Route>
            </Switch>
        </Router>
    )
}

export default App