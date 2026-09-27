import React, { useState, useMemo } from 'react';
import { Visit, Patient } from '../types';
import { sortQueue, filterQueue, SortRule, AcuityFilter } from '../utils/queueSorter';

export interface UseQueueFilterOptions {
  queue: Visit[];
  patientsMap: Record<string, Patient>;
  initialEntriesPerPage?: number;
}

export function useQueueFilter({ queue, patientsMap, initialEntriesPerPage = 6 }: UseQueueFilterOptions) {
  const [sortRule, setSortRule] = useState<SortRule>('urgency');
  const [acuityFilter, setAcuityFilter] = useState<AcuityFilter>('all');
  const [queueSearchQuery, setQueueSearchQuery] = useState<string>('');
  const [queuePage, setQueuePage] = useState<number>(1);
  const [entriesPerPage, setEntriesPerPage] = useState<number>(initialEntriesPerPage);
  const [pinnedVisitIds, setPinnedVisitIds] = useState<Record<string, boolean>>({});

  const togglePinVisit = (visitId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinnedVisitIds(prev => ({ ...prev, [visitId]: !prev[visitId] }));
  };

  const handleSetSortRule = (rule: SortRule) => {
    setSortRule(rule);
    setQueuePage(1);
  };

  const handleSetAcuityFilter = (filter: AcuityFilter) => {
    setAcuityFilter(filter);
    setQueuePage(1);
  };

  const handleSetSearchQuery = (query: string) => {
    setQueueSearchQuery(query);
    setQueuePage(1);
  };

  const handleSetEntriesPerPage = (count: number) => {
    setEntriesPerPage(count);
    setQueuePage(1);
  };

  // 1. Sort queue
  const sortedQueue = useMemo(() => {
    return sortQueue(queue, sortRule, patientsMap, pinnedVisitIds);
  }, [queue, sortRule, patientsMap, pinnedVisitIds]);

  // 2. Filter queue (Acuity + Search)
  const filteredQueue = useMemo(() => {
    return filterQueue(sortedQueue, acuityFilter, queueSearchQuery, patientsMap);
  }, [sortedQueue, acuityFilter, queueSearchQuery, patientsMap]);

  // 3. Calculate Pagination
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredQueue.length / entriesPerPage));
  }, [filteredQueue.length, entriesPerPage]);

  const currentPage = useMemo(() => {
    return Math.min(Math.max(1, queuePage), totalPages);
  }, [queuePage, totalPages]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * entriesPerPage;
  }, [currentPage, entriesPerPage]);

  const paginatedQueue = useMemo(() => {
    return filteredQueue.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredQueue, startIndex, entriesPerPage]);

  const nextVisit = currentPage === 1 ? paginatedQueue[0] : null;
  const nextPatient = nextVisit ? patientsMap[nextVisit.patientId] : null;
  const remainingQueue = currentPage === 1 ? paginatedQueue.slice(1) : paginatedQueue;

  return {
    sortRule,
    setSortRule: handleSetSortRule,
    acuityFilter,
    setAcuityFilter: handleSetAcuityFilter,
    queueSearchQuery,
    setQueueSearchQuery: handleSetSearchQuery,
    queuePage: currentPage,
    currentPage,
    setQueuePage,
    entriesPerPage,
    setEntriesPerPage: handleSetEntriesPerPage,
    pinnedVisitIds,
    togglePinVisit,
    sortedQueue: filteredQueue,
    paginatedQueue,
    nextVisit,
    nextPatient,
    remainingQueue,
    totalPages,
    startIndex,
  };
}
