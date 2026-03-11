import type { SessionEvent } from '../types.js';

/**
 * Heuristic extraction results — derived from session events
 * without any LLM calls. Always runs, zero cost.
 */
export interface HeuristicResults {
  /** Auto-detected session activity type */
  activity_type: string;
  /** Files that were created or modified */
  files_changed: string[];
  /** Tools used during the session */
  tools_used: string[];
  /** Errors encountered (content excerpts) */
  errors: string[];
  /** Duration in minutes (null if timestamps unavailable) */
  duration_minutes: number | null;
  /** Auto-generated tags based on activity */
  suggested_tags: string[];
  /** Key metrics */
  metrics: {
    total_events: number;
    user_messages: number;
    agent_messages: number;
    tool_calls: number;
    errors: number;
    decisions: number;
  };
}

/**
 * Extract structured insights from session events using heuristics only.
 * No LLM calls, no API keys, no cost.
 */
export function extractHeuristics(events: SessionEvent[]): HeuristicResults {
  const metrics = {
    total_events: events.length,
    user_messages: 0,
    agent_messages: 0,
    tool_calls: 0,
    errors: 0,
    decisions: 0,
  };

  const filesChanged = new Set<string>();
  const toolsUsed = new Set<string>();
  const errors: string[] = [];

  for (const event of events) {
    // Count by type
    switch (event.event_type) {
      case 'message_user': metrics.user_messages++; break;
      case 'message_agent': metrics.agent_messages++; break;
      case 'tool_call': metrics.tool_calls++; break;
      case 'error': metrics.errors++; break;
      case 'decision': metrics.decisions++; break;
    }

    // Extract tool names and file paths from tool_call events
    if (event.event_type === 'tool_call' && event.metadata) {
      const toolName = event.metadata['tool_name'] as string | undefined;
      if (toolName) {
        toolsUsed.add(toolName);

        // Extract file paths from write/edit/read tools
        const toolInput = event.metadata['tool_input'] as Record<string, unknown> | undefined;
        if (toolInput) {
          const filePath = (toolInput['file_path'] ?? toolInput['path']) as string | undefined;
          if (filePath && (toolName === 'Write' || toolName === 'Edit')) {
            filesChanged.add(filePath);
          }
        }
      }
    }

    // Collect errors
    if (event.event_type === 'error') {
      errors.push(event.content.slice(0, 200));
    }
  }

  // Detect activity type
  const activity_type = detectActivityType(events, filesChanged, toolsUsed, metrics);

  // Generate tags
  const suggested_tags = generateTags(activity_type, toolsUsed, filesChanged);

  // Calculate duration
  let duration_minutes: number | null = null;
  if (events.length >= 2) {
    const first = new Date(events[0]!.timestamp).getTime();
    const last = new Date(events[events.length - 1]!.timestamp).getTime();
    if (!isNaN(first) && !isNaN(last)) {
      duration_minutes = Math.round((last - first) / 60000);
    }
  }

  return {
    activity_type,
    files_changed: [...filesChanged],
    tools_used: [...toolsUsed],
    errors: errors.slice(0, 10), // cap at 10
    duration_minutes,
    suggested_tags,
    metrics,
  };
}

function detectActivityType(
  events: SessionEvent[],
  filesChanged: Set<string>,
  toolsUsed: Set<string>,
  metrics: HeuristicResults['metrics'],
): string {
  // Check for error-heavy sessions → debugging
  if (metrics.errors > 3 || (metrics.errors > 0 && metrics.errors / metrics.total_events > 0.1)) {
    return 'debug';
  }

  // Check for many file writes → build
  if (filesChanged.size > 3) {
    return 'build';
  }

  // Check content for refactoring signals
  const hasRefactorSignals = events.some((e) =>
    e.event_type === 'message_user' &&
    /refactor|rename|restructure|clean\s*up|reorganize/i.test(e.content),
  );
  if (hasRefactorSignals) {
    return 'refactor';
  }

  // Check for research patterns (lots of reads, few writes)
  if (toolsUsed.has('Read') && toolsUsed.has('Grep') && filesChanged.size === 0) {
    return 'research';
  }

  // Check for review patterns
  const hasReviewSignals = events.some((e) =>
    e.event_type === 'message_user' &&
    /review|check|audit|look\s*at/i.test(e.content),
  );
  if (hasReviewSignals) {
    return 'review';
  }

  // Check if mostly conversation (few tools)
  if (metrics.tool_calls === 0 && metrics.user_messages + metrics.agent_messages > 5) {
    return 'discussion';
  }

  // Default based on write activity
  if (filesChanged.size > 0) {
    return 'build';
  }

  return 'general';
}

function generateTags(
  activityType: string,
  toolsUsed: Set<string>,
  filesChanged: Set<string>,
): string[] {
  const tags = new Set<string>();

  // Activity type as tag
  tags.add(activityType);

  // Detect file type patterns
  const extensions = new Set<string>();
  for (const file of filesChanged) {
    const ext = file.split('.').pop()?.toLowerCase();
    if (ext) extensions.add(ext);
  }

  if (extensions.has('ts') || extensions.has('tsx')) tags.add('typescript');
  if (extensions.has('py')) tags.add('python');
  if (extensions.has('sql')) tags.add('database');
  if (extensions.has('css') || extensions.has('scss')) tags.add('styling');
  if (extensions.has('test') || extensions.has('spec')) tags.add('testing');

  // Check for test files
  for (const file of filesChanged) {
    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file) || file.includes('/tests/')) {
      tags.add('testing');
    }
  }

  // Tool-based tags
  if (toolsUsed.has('Bash')) tags.add('cli');

  return [...tags];
}
