const CARRIER_TRACKING_URLS: Record<string, string> = {
  ups: 'https://www.ups.com/track?tracknum=',
  usps: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  fedex: 'https://www.fedex.com/fedextrack/?trknbr=',
  dhl: 'https://www.dhl.com/us-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=',
  ontrac: 'https://www.ontrac.com/tracking/?number=',
};

export function getTrackingUrl(trackingNumber: string, carrier?: string | null): string {
  if (carrier) {
    const key = carrier.toLowerCase().replace(/\s+/g, '');
    const baseUrl = CARRIER_TRACKING_URLS[key];
    if (baseUrl) return `${baseUrl}${trackingNumber}`;
  }
  // Default to Google search
  return `https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}+tracking`;
}

export const SUPPORTED_CARRIERS = [
  { value: 'ups', label: 'UPS' },
  { value: 'usps', label: 'USPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'dhl', label: 'DHL' },
  { value: 'ontrac', label: 'OnTrac' },
];
