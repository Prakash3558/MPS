'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const SUPABASE_REALTIME_TOPICS = [
  'public:site_settings',
  'public:media_gallery',
  'public:teachers',
  'public:students',
  'public:homework',
  'public:online_classes',
  'public:attendance',
  'public:fee_records',
  'public:exam_results',
  'public:notice_board',
] as const;

export type SupabaseRealtimeTopic = (typeof SUPABASE_REALTIME_TOPICS)[number] | string;

export interface RealtimeRefreshEvent {
  topic: string;
  table: string;
  eventType: string;
  payload: any;
  timestamp: number;
}

// Convert table name to topic format and vice versa
export function toRealtimeTopic(tableNameOrTopic: string): string {
  if (tableNameOrTopic.startsWith('public:')) return tableNameOrTopic;
  return `public:${tableNameOrTopic}`;
}

export function toCleanTableName(topicOrTable: string): string {
  return topicOrTable.replace(/^public:/, '');
}

/**
 * Global utility to broadcast a change to a table topic worldwide via Supabase Realtime private channel.
 */
export function broadcastSupabaseTableChange(
  tableOrTopic: string,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | string = 'UPDATE',
  payload?: any
) {
  const topic = toRealtimeTopic(tableOrTopic);
  const table = toCleanTableName(tableOrTopic);

  console.log(`[Supabase Realtime] Broadcasting change on topic: ${topic} (${eventType})`, payload);

  // 1. Dispatch DOM event for instant intra-window updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('mps_realtime_change', {
        detail: { topic, table, eventType, payload, timestamp: Date.now() }
      })
    );
    window.dispatchEvent(
      new CustomEvent(`mps_realtime_${table}`, {
        detail: { topic, table, eventType, payload, timestamp: Date.now() }
      })
    );
  }

  // 2. Broadcast via ephemeral Supabase Realtime channel
  try {
    const senderId = `bc_${table}_${Math.random().toString(36).slice(2, 7)}_${Date.now()}`;
    const channel = supabase.channel(senderId, {
      config: { private: false, broadcast: { self: false } }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: '*',
          payload: { topic, table, eventType, data: payload, timestamp: Date.now() }
        }).catch(() => {});
        channel.send({
          type: 'broadcast',
          event: 'table_change',
          payload: { topic, table, eventType, data: payload, timestamp: Date.now() }
        }).catch(() => {});

        setTimeout(() => {
          try {
            supabase.removeChannel(channel);
          } catch (e) {}
        }, 1500);
      }
    });
  } catch (err) {
    // Silent fallback
  }
}

/**
 * Custom React Hook for global realtime table refreshes.
 * Subscribes to table-level broadcast topics and postgres_changes.
 * Triggers re-fetch callbacks and increments refreshCount to trigger useEffect refetches.
 */
export function useSupabaseRealtimeRefresh(
  topics?: SupabaseRealtimeTopic | SupabaseRealtimeTopic[] | readonly SupabaseRealtimeTopic[],
  onRefresh?: (event: RealtimeRefreshEvent) => void,
  enabled: boolean = true
) {
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [lastEvent, setLastEvent] = useState<RealtimeRefreshEvent | null>(null);

  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  // Normalized array of topics to subscribe to
  const topicsToWatch: string[] = topics
    ? (Array.isArray(topics) ? topics : [topics]).map(toRealtimeTopic)
    : [...SUPABASE_REALTIME_TOPICS];

  const topicsKey = topicsToWatch.sort().join(',');

  const triggerRefresh = useCallback((event: RealtimeRefreshEvent) => {
    setLastEvent(event);
    setRefreshCount((prev) => prev + 1);
    if (onRefreshRef.current) {
      try {
        onRefreshRef.current(event);
      } catch (err) {
        console.error('[Supabase Realtime] Error in onRefresh handler:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || topicsToWatch.length === 0) return;

    const activeChannels: RealtimeChannel[] = [];

    // Subscribe to each table-level topic using isolated unique channel names
    topicsToWatch.forEach((topic) => {
      const cleanTable = toCleanTableName(topic);
      const uniqueSubId = `rfsh_${cleanTable}_${Math.random().toString(36).slice(2, 7)}_${Date.now()}`;

      try {
        const channel = supabase.channel(uniqueSubId, {
          config: { private: false, broadcast: { self: false } }
        });

        // 1. Listen to broadcast events on wildcard '*'
        channel.on('broadcast', { event: '*' }, (response: any) => {
          const detail = response?.payload || response;
          triggerRefresh({
            topic,
            table: cleanTable,
            eventType: detail?.eventType || 'BROADCAST',
            payload: detail?.data || detail?.payload || detail,
            timestamp: Date.now()
          });
        });

        // 2. Listen to broadcast events on 'table_change'
        channel.on('broadcast', { event: 'table_change' }, (response: any) => {
          const detail = response?.payload || response;
          triggerRefresh({
            topic,
            table: cleanTable,
            eventType: detail?.eventType || 'UPDATE',
            payload: detail?.data || detail?.payload || detail,
            timestamp: Date.now()
          });
        });

        // 3. Listen to Postgres table changes (INSERT, UPDATE, DELETE)
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: cleanTable },
          (payload: any) => {
            triggerRefresh({
              topic,
              table: cleanTable,
              eventType: payload?.eventType || 'POSTGRES_CHANGE',
              payload: payload?.new || payload?.old || payload,
              timestamp: Date.now()
            });
          }
        );

        // Subscribe to the channel gracefully
        channel.subscribe();

        activeChannels.push(channel);
      } catch (err) {
        // Fallback
      }
    });

    // 4. Intra-window DOM event listener for instantaneous local dispatch
    const handleDOMEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      const eventTopic = detail?.topic || (detail?.table ? toRealtimeTopic(detail.table) : '');

      if (eventTopic && topicsToWatch.includes(eventTopic)) {
        console.log(`[Supabase Realtime] Intra-window event caught on topic: ${eventTopic}`);
        triggerRefresh({
          topic: eventTopic,
          table: detail.table || toCleanTableName(eventTopic),
          eventType: detail.eventType || 'LOCAL_UPDATE',
          payload: detail.payload,
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('mps_realtime_change', handleDOMEvent);

    // Cleanup on unmount or dependency change
    return () => {
      console.log(`[Supabase Realtime] Cleaning up subscriptions for topics:`, topicsToWatch);
      window.removeEventListener('mps_realtime_change', handleDOMEvent);

      activeChannels.forEach((ch) => {
        try {
          supabase.removeChannel(ch);
        } catch (err) {
          console.warn('[Supabase Realtime] Error removing channel:', err);
        }
      });
    };
  }, [topicsKey, enabled, triggerRefresh]);

  return {
    refreshCount,
    lastEvent,
    forceRefresh: () => triggerRefresh({
      topic: topicsToWatch[0] || 'public:all',
      table: 'manual',
      eventType: 'MANUAL_REFRESH',
      payload: null,
      timestamp: Date.now()
    })
  };
}
