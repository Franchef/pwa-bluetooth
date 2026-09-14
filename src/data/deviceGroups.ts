import { DeviceGroup } from '../types';

export const DEFAULT_GROUPS: DeviceGroup[] = [
  {
    id: 'grp-warehouse',
    name: 'Warehouse Logistics',
    color: '#06B6D4',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
    badgeText: 'text-cyan-400',
    description: 'Pallet beacons, forklift transponders, shelf sensors',
  },
  {
    id: 'grp-cold-chain',
    name: 'Cold Chain Sensors',
    color: '#3B82F6',
    badgeBg: 'bg-blue-500/10 border-blue-500/30',
    badgeText: 'text-blue-400',
    description: 'Temperature & humidity environmental loggers',
  },
  {
    id: 'grp-office-it',
    name: 'Office & IT Assets',
    color: '#A855F7',
    badgeBg: 'bg-purple-500/10 border-purple-500/30',
    badgeText: 'text-purple-400',
    description: 'Laptops, conference displays, lab test gear',
  },
  {
    id: 'grp-field-ops',
    name: 'Field Operations',
    color: '#10B981',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-400',
    description: 'Worker badges, outdoor survey markers, mobile gateways',
  },
  {
    id: 'grp-fleet',
    name: 'Fleet Trackers',
    color: '#F59E0B',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    badgeText: 'text-amber-400',
    description: 'Trailer beacons, vehicle OBD BLE tags',
  },
  {
    id: 'grp-unassigned',
    name: 'Unassigned',
    color: '#64748B',
    badgeBg: 'bg-slate-800 border-slate-700',
    badgeText: 'text-slate-400',
    description: 'Newly detected devices awaiting classification',
  },
];

export const DEVICE_GROUPS = DEFAULT_GROUPS;
