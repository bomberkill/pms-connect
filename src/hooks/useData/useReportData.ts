import { useMutation } from '@apollo/client';
import { buildCreateReportMutation } from '@/graphql/queries/index';
import { CreateReportInput } from '@/types/Report';

/**
 * Hook for submitting a report on a post, comment, or user.
 */
export const useReportActions = () => {
    const [createReport, { loading: submitting, error: submitError }] = useMutation<
        { createReport: boolean }, { input: CreateReportInput }
    >(buildCreateReportMutation());

    return { createReport, submitting, submitError };
};
