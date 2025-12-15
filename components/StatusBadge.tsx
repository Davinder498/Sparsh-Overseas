
import React from 'react';
import { ApplicationStatus } from '../types';

interface Props {
  status: ApplicationStatus;
}

const StatusBadge: React.FC<Props> = ({ status }) => {
  const styles = {
    [ApplicationStatus.DRAFT]: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    [ApplicationStatus.SUBMITTED]: "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700/50",
    [ApplicationStatus.ATTESTED]: "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700/50",
    [ApplicationStatus.REJECTED]: "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/50",
    [ApplicationStatus.SENT_TO_SPARSH]: "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/50",
  };

  const labels = {
    [ApplicationStatus.DRAFT]: "Draft",
    [ApplicationStatus.SUBMITTED]: "Pending Notary",
    [ApplicationStatus.ATTESTED]: "Attested",
    [ApplicationStatus.REJECTED]: "Rejected",
    [ApplicationStatus.SENT_TO_SPARSH]: "Sent to SPARSH",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default StatusBadge;
