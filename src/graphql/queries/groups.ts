import { gql } from "@apollo/client";
import { USER_FIELDS } from "./user";

export const GROUP_FIELDS = `
  _id
  name
  slug
  description
  privacy
  profileImageUrl
  coverImageUrl
  createdAt
  updatedAt
  creator {
    ${USER_FIELDS}
  }
`;

export const buildGetGroupsQuery = () => {
  return gql`
    query getGroups($skip: Int, $limit: Int, $search: String, $privacy: GroupPrivacy) {
      getGroups(skip: $skip, limit: $limit, search: $search, privacy: $privacy) {
        ${GROUP_FIELDS}
      }
    }
  `;
};

export const buildGetGroupBySlugQuery = () => {
  return gql`
    query getGroupBySlug($slug: String!) {
      getGroupBySlug(slug: $slug) {
        ${GROUP_FIELDS}
      }
    }
  `;
};

export const buildCreateGroupMutation = () => {
  return gql`
    mutation createGroup($createGroupInput: CreateGroupInput!) {
      createGroup(createGroupInput: $createGroupInput) {
        ${GROUP_FIELDS}
      }
    }
  `;
};

export const buildLeaveGroupMutation = () => {
  return gql`
    mutation leaveGroup($groupId: ID!) {
      leaveGroup(groupId: $groupId) {
        ${GROUP_FIELDS}
      }
    }
  `;
};

export const buildGetGroupByIdQuery = () => {
  return gql`
    query getGroupById($id: ID!) {
      getGroupById(id: $id) {
        ${GROUP_FIELDS}
      }
    }
  `;
};

export const buildUpdateGroupMutation = () => {
  return gql`
    mutation updateGroup($groupId: ID!, $updateGroupInput: UpdateGroupInput!) {
      updateGroup(groupId: $groupId, updateGroupInput: $updateGroupInput) {
        ${GROUP_FIELDS}
      }
    }
  `;
};

export const buildDeleteGroupMutation = () => {
  return gql`
    mutation deleteGroup($groupId: ID!) {
      deleteGroup(groupId: $groupId)
    }
  `;
};

/**
 * Builds a GraphQL query for fetching group members.
 * Uses the new GroupMembership collection.
 */
export const buildGetGroupMembersQuery = () => {
  return gql`
    query getGroupMembers($groupId: ID!, $skip: Int, $limit: Int) {
      getGroupMembers(groupId: $groupId, skip: $skip, limit: $limit) {
        _id
        user {
          ${USER_FIELDS}
        }
        role
        joinedAt
      }
    }
  `;
};

/**
 * Builds a GraphQL mutation for joining a group.
 */
export const buildJoinGroupMutation = () => {
  return gql`
    mutation requestToJoinGroup($groupId: ID!) {
      requestToJoinGroup(groupId: $groupId)
    }
  `;
};

export const buildGetMyGroupMembershipQuery = () => {
  return gql`
    query getMyGroupMembership($groupId: ID!) {
      getMyGroupMembership(groupId: $groupId) {
        _id
        role
        joinedAt
        user {
          ${USER_FIELDS}
        }
      }
    }
  `;
};

export const buildGetMyGroupJoinRequestsQuery = () => {
  return gql`
    query getMyGroupJoinRequests($groupId: ID, $status: GroupJoinRequestStatusGQL, $skip: Int, $limit: Int) {
      getMyGroupJoinRequests(groupId: $groupId, status: $status, skip: $skip, limit: $limit) {
        id
        status
        createdAt
        updatedAt
        group {
          ${GROUP_FIELDS}
        }
        user {
          ${USER_FIELDS}
        }
      }
    }
  `;
};

export const buildAcceptGroupInvitationMutation = () => {
  return gql`
    mutation acceptGroupInvitation($input: RespondToGroupJoinRequestInput!) {
      acceptGroupInvitation(input: $input)
    }
  `;
};

export const buildDeclineGroupInvitationMutation = () => {
  return gql`
    mutation declineGroupInvitation($input: RespondToGroupJoinRequestInput!) {
      declineGroupInvitation(input: $input)
    }
  `;
};

export const buildCancelGroupJoinRequestMutation = () => {
  return gql`
    mutation cancelGroupJoinRequest($input: RespondToGroupJoinRequestInput!) {
      cancelGroupJoinRequest(input: $input)
    }
  `;
};

export const buildGetGroupJoinRequestsQuery = () => {
  return gql`
    query getGroupJoinRequests($groupId: ID!, $status: GroupJoinRequestStatusGQL) {
      getGroupJoinRequests(groupId: $groupId, status: $status) {
        id
        status
        createdAt
        updatedAt
        group {
          ${GROUP_FIELDS}
        }
        user {
          ${USER_FIELDS}
        }
      }
    }
  `;
};

export const buildApproveGroupJoinRequestMutation = () => {
  return gql`
    mutation approveGroupJoinRequest($input: RespondToGroupJoinRequestInput!) {
      approveGroupJoinRequest(input: $input)
    }
  `;
};

export const buildRejectGroupJoinRequestMutation = () => {
  return gql`
    mutation rejectGroupJoinRequest($input: RespondToGroupJoinRequestInput!) {
      rejectGroupJoinRequest(input: $input)
    }
  `;
};

export const buildRemoveGroupMemberMutation = () => {
  return gql`
    mutation removeGroupMember($groupId: ID!, $userId: ID!) {
      removeGroupMember(groupId: $groupId, userId: $userId) {
        ${GROUP_FIELDS}
      }
    }
  `;
};

export const buildUpdateGroupMemberRoleMutation = () => {
  return gql`
    mutation updateGroupMemberRole($groupId: ID!, $updateGroupMemberRoleInput: UpdateGroupMemberRoleInput!) {
      updateGroupMemberRole(groupId: $groupId, updateGroupMemberRoleInput: $updateGroupMemberRoleInput) {
        _id
        role
        joinedAt
        user {
          ${USER_FIELDS}
        }
      }
    }
  `;
};
