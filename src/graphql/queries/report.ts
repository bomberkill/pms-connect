import { gql } from "@apollo/client";

/**
 * Builds a GraphQL mutation for reporting a post, comment, or user.
 * Corresponds to the 'createReport' resolver in reports.resolver.ts.
 */
export const buildCreateReportMutation = () => {
  return gql`
    mutation CreateReport($input: CreateReportInput!) {
      createReport(input: $input)
    }
  `;
};
