import {Network} from './models/network';

export function buildIframeUrl(
  iframeUrl: string,
  picker: boolean,
  sdkConfig: Record<string, any>,
  transactionDialogs?: boolean,
  network?: Network,
): string {
  const query = encodeQuery({
    transactionDialogs,
    picker,
    network,
    sdkConfig: JSON.stringify(sdkConfig),
  });
  return `${iframeUrl}?${query}`;
}

function encodeQuery(query: Record<string, string | number | boolean | undefined>) {
  return Object.entries(query)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value?.toString() ?? '')}`)
    .join('&');
}
