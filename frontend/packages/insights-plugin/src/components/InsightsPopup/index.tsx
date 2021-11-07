import * as React from 'react';
import { ChartDonut, ChartLegend, ChartLabel } from '@patternfly/react-charts';

import {
  riskIcons,
  colorScale,
  legendColorScale,
  riskSorting,
  mapMetrics,
  isWaitingOrDisabled as _isWaitingOrDisabled,
  isError as _isError,
} from './mappers';
import { PrometheusHealthPopupProps } from '@console/plugin-sdk';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ExternalLink, isUpstream, openshiftHelpBase } from '@console/internal/components/utils';
import './style.scss';

const DataComponent: React.FC<DataComponentProps> = ({ x, y, datum }) => {
  const Icon = riskIcons[datum.id];
  return <Icon x={x} y={y - 5} fill={legendColorScale[datum.id]} />;
};

export const InsightsPopup: React.FC<PrometheusHealthPopupProps> = ({ responses, k8sResult }) => {
  const metrics = mapMetrics(responses[0].response);
  const clusterID = (k8sResult as K8sResourceKind)?.data?.spec?.clusterID || '';
  const riskEntries = Object.entries(metrics).sort(
    ([k1], [k2]) => riskSorting[k1] - riskSorting[k2],
  );
  const numberOfIssues = Object.values(metrics).reduce((acc, cur) => acc + cur, 0);

  const isWaitingOrDisabled = _isWaitingOrDisabled(metrics);
  const isError = _isError(metrics);

  const insightsLink = isUpstream()
    ? `${openshiftHelpBase}support/remote_health_monitoring/using-insights-to-identify-issues-with-your-cluster.html`
    : `${openshiftHelpBase}html/support/remote-health-monitoring-with-connected-clusters#using-insights-to-identify-issues-with-your-cluster`;

  return (
    <div className="co-insights__box">
      {isError && <div className="co-status-popup__section">Temporary unavailable.</div>}
      {isWaitingOrDisabled && (
        <div className="co-status-popup__section">Disabled or waiting for results.</div>
      )}
      <div className="co-status-popup__section">
        {!isWaitingOrDisabled && !isError && (
          <div>
            <ChartDonut
              data={riskEntries.map(([k, v]) => ({
                label: `${v} ${k}`,
                x: k,
                y: v,
              }))}
              title={`${numberOfIssues}`}
              subTitle={`Total ${numberOfIssues === 1 ? 'issue' : 'issues'}`}
              legendData={Object.entries(metrics).map(([k, v]) => ({ name: `${k}: ${v}` }))}
              legendOrientation="vertical"
              width={304}
              height={152}
              colorScale={colorScale}
              constrainToVisibleArea
              legendComponent={
                <ChartLegend
                  title="Total Risk"
                  titleComponent={
                    <ChartLabel dx={13} style={{ fontWeight: 'bold', fontSize: '14px' }} />
                  }
                  data={riskEntries.map(([k, v]) => ({
                    name: `${v} ${k}`,
                    id: k,
                  }))}
                  dataComponent={<DataComponent />}
                  x={-13}
                />
              }
              padding={{
                bottom: 20,
                left: 145,
                right: 20, // Adjusted to accommodate legend
                top: 0,
              }}
            />
          </div>
        )}
      </div>
      <div className="co-status-popup__section">
        {!isWaitingOrDisabled && !isError && (
          <>
            <h6 className="pf-c-title pf-m-md">Fixable issues</h6>
            <div>
              <ExternalLink
                href={`https://console.redhat.com/openshift/details/${clusterID}#insights`}
                text="View all in OpenShift Cluster Manager"
              />
            </div>
          </>
        )}
        {(isWaitingOrDisabled || isError) && (
          <ExternalLink href={insightsLink} text="More about Insights" />
        )}
      </div>
    </div>
  );
};

export type DataComponentProps = {
  x?: number;
  y?: number;
  datum?: {
    id: string;
  };
};

InsightsPopup.displayName = 'InsightsPopup';
