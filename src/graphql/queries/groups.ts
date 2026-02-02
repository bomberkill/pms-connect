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
      leaveOrRemoveMemberFromGroup(groupId: $groupId) {
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
    mutation joinGroup($groupId: ID!) {
      joinGroup(groupId: $groupId) {
        ${GROUP_FIELDS}
      }
    }
  `;
};
