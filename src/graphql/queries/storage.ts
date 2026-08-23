import { gql } from "@apollo/client";

export const GET_UPLOAD_URL = gql`
  mutation GetUploadUrl($input: GetUploadUrlInput!) {
    getUploadUrl(input: $input) {
      uploadUrl
      publicUrl
      key
    }
  }
`;

export const DELETE_UPLOADED_FILE = gql`
  mutation DeleteUploadedFile($key: String!) {
    deleteUploadedFile(key: $key)
  }
`;
