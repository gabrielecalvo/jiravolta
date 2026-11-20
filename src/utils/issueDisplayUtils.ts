import type { IssueDisplayMode, Worklog } from '../types';
import { formatDate, formatDuration, formatTime } from './dateUtils';

export function trimLabel(label: string, maxLength: number): string {
    if (maxLength <= 0 || label.length <= maxLength) {
        return label;
    }

    if (maxLength <= 1) {
        return '…';
    }

    return `${label.slice(0, maxLength - 1)}…`;
}

export function getIssueLabel(
    issueKey: string,
    issueNameMap: Record<string, string>,
    mode: IssueDisplayMode,
    maxLength?: number,
): string {
    const base = mode === 'name' ? (issueNameMap[issueKey] || issueKey) : issueKey;
    if (!maxLength || maxLength < 1) {
        return base;
    }

    return trimLabel(base, maxLength);
}

export function buildWorklogTooltip(worklog: Worklog, issueFullLabel: string): string {
    const start = new Date(worklog.start);
    const end = new Date(worklog.end);
    const lines = [
        `${issueFullLabel} (${worklog.issueKey})`,
        `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)} (${formatDuration(worklog.durationMinutes)})`,
    ];
    if (worklog.comment) {
        lines.push(`Comment: ${worklog.comment}`);
    }
    return lines.join('\n');
}
