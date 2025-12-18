
import React from 'react';
import { ApplicationStatus } from '../types';

interface Props {
  status: ApplicationStatus;
}

const StatusBadge: React.FC<Props> = ({ status }) => {
  const styles = {
    [ApplicationStatus.DRAFT]: "bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-200",
    [ApplicationStatus.SUBMITTED]: "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/50",
    [ApplicationStatus.ATTESTED]: "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700/50",
    [ApplicationStatus.REJECTED]: "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/50",
    [ApplicationStatus.SENT_TO_SPARSH]: "bg-secondary text-white border border-secondary dark:bg-secondary/80 dark:text-accent dark:border-accent/30",
  };

  const labels = {
    [ApplicationStatus.DRAFT]: "Draft",
    [ApplicationStatus.SUBMITTED]: "Pending Notary",
    [ApplicationStatus.ATTESTED]: "Attested",
    [ApplicationStatus.REJECTED]: "Rejected",
    [ApplicationStatus.SENT_TO_SPARSH]: "Sent to SPARSH",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default StatusBadge;
