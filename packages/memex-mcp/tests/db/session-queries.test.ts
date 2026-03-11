import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import { migrate } from '../../src/db/migrations.js';
import {
  insertSession,
  updateSessionEnd,
  getSessionById,
  listSessions,
  getSessionCount,
  insertSessionEvent,
  getSessionEvents,
  getNextSequence,
  getEventCount,
  searchSessionContent,
  insertSessionBatch,
  getSessionEventById,
} from '../../src/db/session-queries.js';
import { encryptContent, decryptContent } from '../../src/crypto/encryption.js';
import { ulid } from '../../src/lib/ulid.js';

const key = crypto.randomBytes(32);

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  migrate(db);
  return db;
}

function createSession(
  db: Database.Database,
  overrides: Partial<{
    id: string;
    project: string;
    agent_source: string;
    title: string;
    tags: string[];
    started_at: string;
  }> = {},
) {
  const id = overrides.id ?? ulid();
  insertSession(db, {
    id,
    project: overrides.project ?? '/test/project',
    agent_source: overrides.agent_source ?? 'claude-code',
    title: overrides.title,
    tags: overrides.tags ?? [],
    started_at: overrides.started_at ?? new Date().toISOString(),
  });
  return id;
}

function addEvent(
  db: Database.Database,
  sessionId: string,
  content: string,
  eventType = 'message_user',
  project = '/test/project',
) {
  const { iv, ciphertext, authTag } = encryptContent(content, key);
  const sequence = getNextSequence(db, sessionId);
  const eventId = ulid();
  insertSessionEvent(db, {
    id: eventId,
    session_id: sessionId,
    sequence,
    event_type: eventType,
    timestamp: new Date().toISOString(),
    contentEnc: ciphertext,
    iv,
    authTag,
    content,
    project,
  });
  return eventId;
}

describe('session-queries', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe('migration v2', () => {
    it('should create sessions and session_events tables', () => {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as Array<{ name: string }>;
      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain('sessions');
      expect(tableNames).toContain('session_events');
    });

    it('should create sessions_fts virtual table', () => {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions_fts'")
        .all();
      expect(tables.length).toBe(1);
    });
  });

  describe('insertSession + getSessionById', () => {
    it('should insert and retrieve a session', () => {
      const id = createSession(db, { title: 'Test session', tags: ['test'] });
      const session = getSessionById(db, id);

      expect(session).toBeDefined();
      expect(session!.id).toBe(id);
      expect(session!.project).toBe('/test/project');
      expect(session!.agent_source).toBe('claude-code');
      expect(session!.title).toBe('Test session');
      expect(JSON.parse(session!.tags)).toEqual(['test']);
      expect(session!.ended_at).toBeNull();
    });

    it('should return undefined for non-existent session', () => {
      const session = getSessionById(db, 'nonexistent');
      expect(session).toBeUndefined();
    });
  });

  describe('updateSessionEnd', () => {
    it('should end a session with summary', () => {
      const id = createSession(db);
      const summary = 'This session fixed the auth bug';
      const { iv, ciphertext, authTag } = encryptContent(summary, key);

      const updated = updateSessionEnd(db, {
        id,
        summaryEnc: ciphertext,
        summaryIv: iv,
        summaryAuthTag: authTag,
        ended_at: new Date().toISOString(),
        event_count: 5,
      });

      expect(updated).toBe(true);

      const session = getSessionById(db, id);
      expect(session!.ended_at).not.toBeNull();
      expect(session!.event_count).toBe(5);

      // Decrypt summary
      const decrypted = decryptContent(
        session!.summary_enc as unknown as Buffer,
        session!.summary_iv as unknown as Buffer,
        session!.summary_auth_tag as unknown as Buffer,
        key,
      );
      expect(decrypted).toBe(summary);
    });

    it('should update tags when ending', () => {
      const id = createSession(db, { tags: ['initial'] });

      updateSessionEnd(db, {
        id,
        tags: ['completed', 'auth'],
        ended_at: new Date().toISOString(),
        event_count: 3,
      });

      const session = getSessionById(db, id);
      expect(JSON.parse(session!.tags)).toEqual(['completed', 'auth']);
    });
  });

  describe('listSessions', () => {
    it('should list sessions ordered by started_at DESC', () => {
      createSession(db, { started_at: '2026-01-01T00:00:00Z', title: 'First' });
      createSession(db, { started_at: '2026-01-03T00:00:00Z', title: 'Third' });
      createSession(db, { started_at: '2026-01-02T00:00:00Z', title: 'Second' });

      const rows = listSessions(db, { limit: 10, offset: 0 });
      expect(rows.length).toBe(3);
      expect(rows[0]!.title).toBe('Third');
      expect(rows[1]!.title).toBe('Second');
      expect(rows[2]!.title).toBe('First');
    });

    it('should filter by project', () => {
      createSession(db, { project: '/project/a' });
      createSession(db, { project: '/project/b' });

      const rows = listSessions(db, { project: '/project/a', limit: 10, offset: 0 });
      expect(rows.length).toBe(1);
      expect(rows[0]!.project).toBe('/project/a');
    });

    it('should filter by agent_source', () => {
      createSession(db, { agent_source: 'claude-code' });
      createSession(db, { agent_source: 'cursor' });

      const rows = listSessions(db, { agent_source: 'cursor', limit: 10, offset: 0 });
      expect(rows.length).toBe(1);
    });

    it('should filter by status', () => {
      const activeId = createSession(db);
      const endedId = createSession(db);
      updateSessionEnd(db, { id: endedId, ended_at: new Date().toISOString(), event_count: 0 });

      const active = listSessions(db, { status: 'active', limit: 10, offset: 0 });
      expect(active.length).toBe(1);
      expect(active[0]!.id).toBe(activeId);

      const ended = listSessions(db, { status: 'ended', limit: 10, offset: 0 });
      expect(ended.length).toBe(1);
      expect(ended[0]!.id).toBe(endedId);

      const all = listSessions(db, { status: 'all', limit: 10, offset: 0 });
      expect(all.length).toBe(2);
    });

    it('should filter by tags', () => {
      createSession(db, { tags: ['auth', 'bugfix'] });
      createSession(db, { tags: ['feature'] });

      const rows = listSessions(db, { tags: ['auth'], limit: 10, offset: 0 });
      expect(rows.length).toBe(1);
    });

    it('should respect limit and offset', () => {
      for (let i = 0; i < 5; i++) {
        createSession(db);
      }

      const page1 = listSessions(db, { limit: 2, offset: 0 });
      expect(page1.length).toBe(2);

      const page2 = listSessions(db, { limit: 2, offset: 2 });
      expect(page2.length).toBe(2);
    });
  });

  describe('getSessionCount', () => {
    it('should count all sessions', () => {
      createSession(db);
      createSession(db);
      expect(getSessionCount(db)).toBe(2);
    });

    it('should count by project', () => {
      createSession(db, { project: '/a' });
      createSession(db, { project: '/a' });
      createSession(db, { project: '/b' });

      expect(getSessionCount(db, '/a')).toBe(2);
      expect(getSessionCount(db, '/b')).toBe(1);
    });
  });

  describe('session events', () => {
    it('should insert and retrieve events with encryption', () => {
      const sessionId = createSession(db);
      const eventId = addEvent(db, sessionId, 'Hello, world!');

      const events = getSessionEvents(db, {
        session_id: sessionId,
        limit: 10,
        offset: 0,
      });

      expect(events.length).toBe(1);
      expect(events[0]!.id).toBe(eventId);
      expect(events[0]!.sequence).toBe(0);

      // Decrypt
      const content = decryptContent(
        events[0]!.content_enc as unknown as Buffer,
        events[0]!.iv as unknown as Buffer,
        events[0]!.auth_tag as unknown as Buffer,
        key,
      );
      expect(content).toBe('Hello, world!');
    });

    it('should auto-increment sequence numbers', () => {
      const sessionId = createSession(db);
      addEvent(db, sessionId, 'First');
      addEvent(db, sessionId, 'Second');
      addEvent(db, sessionId, 'Third');

      const events = getSessionEvents(db, {
        session_id: sessionId,
        limit: 10,
        offset: 0,
      });

      expect(events.map((e) => e.sequence)).toEqual([0, 1, 2]);
    });

    it('should filter events by type', () => {
      const sessionId = createSession(db);
      addEvent(db, sessionId, 'User msg', 'message_user');
      addEvent(db, sessionId, 'Agent msg', 'message_agent');
      addEvent(db, sessionId, 'Tool call', 'tool_call');

      const agentOnly = getSessionEvents(db, {
        session_id: sessionId,
        event_types: ['message_agent'],
        limit: 10,
        offset: 0,
      });

      expect(agentOnly.length).toBe(1);
    });

    it('should count events', () => {
      const sessionId = createSession(db);
      addEvent(db, sessionId, 'One');
      addEvent(db, sessionId, 'Two');

      expect(getEventCount(db, sessionId)).toBe(2);
    });

    it('should get event by ID', () => {
      const sessionId = createSession(db);
      const eventId = addEvent(db, sessionId, 'Find me');

      const event = getSessionEventById(db, eventId);
      expect(event).toBeDefined();
      expect(event!.id).toBe(eventId);
    });
  });

  describe('FTS search', () => {
    it('should find events by content search', () => {
      const sessionId = createSession(db);
      addEvent(db, sessionId, 'The authentication system uses JWT tokens');
      addEvent(db, sessionId, 'Database uses PostgreSQL with Prisma ORM');

      const results = searchSessionContent(db, {
        query: 'authentication JWT',
        limit: 10,
      });

      expect(results.length).toBe(1);
      expect(results[0]!.session_id).toBe(sessionId);
    });

    it('should filter search by project', () => {
      const s1 = createSession(db, { project: '/project/a' });
      addEvent(db, s1, 'Auth code here', 'message_agent', '/project/a');
      const s2 = createSession(db, { project: '/project/b' });
      addEvent(db, s2, 'Auth code there', 'message_agent', '/project/b');

      const results = searchSessionContent(db, {
        query: 'Auth code',
        project: '/project/a',
        limit: 10,
      });

      expect(results.length).toBe(1);
      expect(results[0]!.project).toBe('/project/a');
    });

    it('should filter search by event_type', () => {
      const sessionId = createSession(db);
      addEvent(db, sessionId, 'User asked about auth', 'message_user');
      addEvent(db, sessionId, 'Agent explained auth', 'message_agent');

      const results = searchSessionContent(db, {
        query: 'auth',
        event_type: 'message_agent',
        limit: 10,
      });

      expect(results.length).toBe(1);
      expect(results[0]!.event_type).toBe('message_agent');
    });
  });

  describe('insertSessionBatch', () => {
    it('should bulk insert a session with events', () => {
      const sessionId = ulid();
      const events = Array.from({ length: 5 }, (_, i) => {
        const content = `Event ${i}`;
        const { iv, ciphertext, authTag } = encryptContent(content, key);
        return {
          id: ulid(),
          sequence: i,
          event_type: 'message_user',
          timestamp: new Date().toISOString(),
          contentEnc: ciphertext,
          iv,
          authTag,
          content,
        };
      });

      insertSessionBatch(
        db,
        {
          id: sessionId,
          project: '/test/project',
          agent_source: 'generic',
          title: 'Batch session',
          tags: ['imported'],
          started_at: events[0]!.timestamp,
          ended_at: events[events.length - 1]!.timestamp,
        },
        events,
      );

      const session = getSessionById(db, sessionId);
      expect(session).toBeDefined();
      expect(session!.event_count).toBe(5);
      expect(session!.title).toBe('Batch session');

      const storedEvents = getSessionEvents(db, {
        session_id: sessionId,
        limit: 100,
        offset: 0,
      });
      expect(storedEvents.length).toBe(5);

      // Verify FTS works for batch-inserted events
      const results = searchSessionContent(db, {
        query: 'Event 3',
        limit: 10,
      });
      expect(results.length).toBe(1);
    });
  });
});
