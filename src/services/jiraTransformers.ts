/**
 * Transform Jira API responses to application data structures
 */

import type { Worklog } from '../types';
import type { JiraWorklog, JiraWorklogResponse } from './jiraTypes';

/**
 * Transform a Jira worklog to our application Worklog format
 */
export function transformJiraWorklog(jiraWorklog: JiraWorklog, issueKeyMap: Record<string, string> = {}): Worklog {
    const started = new Date(jiraWorklog.started);
    const durationMinutes = Math.round(jiraWorklog.timeSpentSeconds / 60);

    const end = new Date(started);
    end.setMinutes(end.getMinutes() + durationMinutes);

    return {
        id: jiraWorklog.id,
        issueKey: jiraWorklog.issueKey || issueKeyMap[jiraWorklog.issueId] || extractIssueKeyFromId(jiraWorklog.issueId),
        start: started.toISOString(),
        end: end.toISOString(),
        durationMinutes,
        source: 'jira',
        comment: adfToText(jiraWorklog.comment) || undefined,
    };
}

interface AdfNode {
    type?: string;
    text?: string;
    content?: AdfNode[];
}

export function adfToText(adf: unknown): string {
    if (!adf) return '';
    if (typeof adf === 'string') return adf;
    const collect = (node: AdfNode): string => {
        if (node.type === 'text') return node.text ?? '';
        if (node.type === 'hardBreak') return '\n';
        const children = (node.content ?? []).map(collect);
        return node.type === 'doc' ? children.join('\n') : children.join('');
    };
    return collect(adf as AdfNode).trim();
}

export function textToAdf(text: string | undefined) {
    const lines = (text ?? '').trim().split('\n');
    return {
        type: 'doc',
        version: 1,
        content: lines.map(line => ({
            type: 'paragraph',
            content: line ? [{ type: 'text', text: line }] : [],
        })),
    };
}

/**
 * Transform a Jira worklog response to an array of Worklogs
 */
export function transformJiraWorklogResponse(response: JiraWorklogResponse): Worklog[] {
    return response.results.map(w => transformJiraWorklog(w));
}

/**
 * Transform a flat worklog array from POST /rest/api/3/worklog/list,
 * using the issueKeyMap to resolve issueKey for each entry.
 */
export function transformJiraWorklogList(worklogs: JiraWorklog[], issueKeyMap: Record<string, string>): Worklog[] {
    return worklogs.map(w => transformJiraWorklog(w, issueKeyMap));
}

/**
 * Extract issue key from issue ID (fallback if issueKey not provided)
 * This is a placeholder - in reality, you'd need to fetch the issue details
 */
function extractIssueKeyFromId(issueId: string): string {
    // In a real implementation, you'd cache issue ID to key mappings
    // or fetch the issue details from the API
    return `ISSUE-${issueId.slice(-3)}`;
}

/**
 * Format a date for Jira API query parameters
 * Jira expects ISO 8601 format with timezone
 */
export function formatDateForJira(date: Date): string {
    return date.toISOString();
}
