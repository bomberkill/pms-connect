"use client";

import React, { useEffect } from "react";
import { useConnectionRequests, useConnectionRequestUpdatedSubscription, useUsers } from "@/hooks/useData/index";
import { ConnectionRequestStatus } from "@/types/ConnectionRequest";
import FriendsDesktopView from "@/components/friends/FriendsDesktopView";
import { useAppSelector } from "@/lib/hooks";

export default function FriendsPage() {

  const {user} = useAppSelector((state) => state.user);

  const { suggestions: suggestedFriends, loading: loadingSuggestions } = useUsers({ limit: 5 });
  const { requests: pendingRequests, loading: loadingPending, refetch: refetchPending } =
    useConnectionRequests(ConnectionRequestStatus.PENDING);
//   const { requests: acceptedRequests, loading: loadingAccepted, refetch: refetchAccepted } =
//     useConnectionRequests(ConnectionRequestStatus.ACCEPTED);

  const { updatedRequest } = useConnectionRequestUpdatedSubscription();

//   const connectionRequests = [
//   // --- L'utilisateur est le REQUESTER ---
//   {
//     id: "req1",
//     requester: {
//       id: "68a61cce59526998b09530e7",
//       firebaseUid: "mYH7NfMX1HT2uzVNGh4O9XwFlhD2",
//       email: "moi5@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/profile/1756392601188_20240124_162150.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/cover/1755716803839_20250805_211206.jpg",
//       location: { city: "Loum", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "Kamwa",
//       lastName: "Ronald",
//       speciality: "MEDICAL_DOCTORS",
//       professionalTitle: "Director CHU of Bamenda",
//       bio: "I am the director of CHU of Douala",
//       slug: "kamwa-ronald",
//     },
//     recipient: {
//       id: "68aee292091871192c6d14ec",
//       firebaseUid: "SPtsjfuVERNUlFKGwskPu9a4ngH3",
//       email: "kingkoumetio29.kck@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/profile/1756291669942_IMG-20250827-WA0050.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/cover/1756291669953_adobestock_322540144-taille1200_6464a7afd9af5_0.jpg",
//       location: { city: "Douala", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "KING",
//       lastName: "KOUMETIO",
//       speciality: "NURSES",
//       professionalTitle: "Directeur MALATITI",
//       bio: "KING KOUME\nTHE CRAZY NURSE",
//       slug: "king-koume",
//     },
//     status: "PENDING",
//     createdAt: "2025-10-18T10:45:00.000Z",
//     updatedAt: "2025-10-18T10:45:00.000Z",
//   },
//   {
//     id: "req2",
//     requester: {
//       id: "68a61cce59526998b09530e7",
//       firebaseUid: "mYH7NfMX1HT2uzVNGh4O9XwFlhD2",
//       email: "moi5@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/profile/1756392601188_20240124_162150.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/cover/1755716803839_20250805_211206.jpg",
//       location: { city: "Loum", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "Kamwa",
//       lastName: "Ronald",
//       speciality: "MEDICAL_DOCTORS",
//       professionalTitle: "Director CHU of Bamenda",
//       bio: "I am the director of CHU of Douala",
//       slug: "kamwa-ronald",
//     },
//     recipient: {
//       id: "68aee292091871192c6d14ec",
//       firebaseUid: "SPtsjfuVERNUlFKGwskPu9a4ngH3",
//       email: "kingkoumetio29.kck@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/profile/1756291669942_IMG-20250827-WA0050.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/cover/1756291669953_adobestock_322540144-taille1200_6464a7afd9af5_0.jpg",
//       location: { city: "Douala", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "KING",
//       lastName: "KOUMETIO",
//       speciality: "NURSES",
//       professionalTitle: "Directeur MALATITI",
//       bio: "KING KOUME\nTHE CRAZY NURSE",
//       slug: "king-koume",
//     },
//     status: "PENDING",
//     createdAt: "2025-10-17T11:30:00.000Z",
//     updatedAt: "2025-10-17T11:30:00.000Z",
//   },
//   {
//     id: "req3",
//     requester: {
//       id: "68a61cce59526998b09530e7",
//       firebaseUid: "mYH7NfMX1HT2uzVNGh4O9XwFlhD2",
//       email: "moi5@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/profile/1756392601188_20240124_162150.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/cover/1755716803839_20250805_211206.jpg",
//       location: { city: "Loum", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "Kamwa",
//       lastName: "Ronald",
//       speciality: "MEDICAL_DOCTORS",
//       professionalTitle: "Director CHU of Bamenda",
//       bio: "I am the director of CHU of Douala",
//       slug: "kamwa-ronald",
//     },
//     recipient: {
//       id: "68aee292091871192c6d14ec",
//       firebaseUid: "SPtsjfuVERNUlFKGwskPu9a4ngH3",
//       email: "kingkoumetio29.kck@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/profile/1756291669942_IMG-20250827-WA0050.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/cover/1756291669953_adobestock_322540144-taille1200_6464a7afd9af5_0.jpg",
//       location: { city: "Douala", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "KING",
//       lastName: "KOUMETIO",
//       speciality: "NURSES",
//       professionalTitle: "Directeur MALATITI",
//       bio: "KING KOUME\nTHE CRAZY NURSE",
//       slug: "king-koume",
//     },
//     status: "PENDING",
//     createdAt: "2025-10-16T09:00:00.000Z",
//     updatedAt: "2025-10-16T09:00:00.000Z",
//   },

//   // --- L'utilisateur est le RECIPIENT ---
//   {
//     id: "req4",
//     requester: {
//       id: "68aee292091871192c6d14ec",
//       firebaseUid: "SPtsjfuVERNUlFKGwskPu9a4ngH3",
//       email: "kingkoumetio29.kck@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/profile/1756291669942_IMG-20250827-WA0050.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/cover/1756291669953_adobestock_322540144-taille1200_6464a7afd9af5_0.jpg",
//       location: { city: "Douala", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "KING",
//       lastName: "KOUMETIO",
//       speciality: "NURSES",
//       professionalTitle: "Directeur MALATITI",
//       bio: "KING KOUME\nTHE CRAZY NURSE",
//       slug: "king-koume",
//     },
//     recipient: {
//       id: "68a61cce59526998b09530e7",
//       firebaseUid: "mYH7NfMX1HT2uzVNGh4O9XwFlhD2",
//       email: "moi5@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/profile/1756392601188_20240124_162150.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/cover/1755716803839_20250805_211206.jpg",
//       location: { city: "Loum", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "Kamwa",
//       lastName: "Ronald",
//       speciality: "MEDICAL_DOCTORS",
//       professionalTitle: "Director CHU of Bamenda",
//       bio: "I am the director of CHU of Douala",
//       slug: "kamwa-ronald",
//     },
//     status: "PENDING",
//     createdAt: "2025-10-15T08:00:00.000Z",
//     updatedAt: "2025-10-15T08:00:00.000Z",
//   },
//   {
//     id: "req5",
//     requester: {
//       id: "68aee292091871192c6d14ec",
//       firebaseUid: "SPtsjfuVERNUlFKGwskPu9a4ngH3",
//       email: "kingkoumetio29.kck@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/profile/1756291669942_IMG-20250827-WA0050.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/cover/1756291669953_adobestock_322540144-taille1200_6464a7afd9af5_0.jpg",
//       location: { city: "Douala", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "KING",
//       lastName: "KOUMETIO",
//       speciality: "NURSES",
//       professionalTitle: "Directeur MALATITI",
//       bio: "KING KOUME\nTHE CRAZY NURSE",
//       slug: "king-koume",
//     },
//     recipient: {
//       id: "68a61cce59526998b09530e7",
//       firebaseUid: "mYH7NfMX1HT2uzVNGh4O9XwFlhD2",
//       email: "moi5@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/profile/1756392601188_20240124_162150.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/cover/1755716803839_20250805_211206.jpg",
//       location: { city: "Loum", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "Kamwa",
//       lastName: "Ronald",
//       speciality: "MEDICAL_DOCTORS",
//       professionalTitle: "Director CHU of Bamenda",
//       bio: "I am the director of CHU of Douala",
//       slug: "kamwa-ronald",
//     },
//     status: "PENDING",
//     createdAt: "2025-10-14T13:00:00.000Z",
//     updatedAt: "2025-10-14T13:00:00.000Z",
//   },
// ];
// const friends = [
//     {
//       id: "68a61cce59526998b09530e7",
//       firebaseUid: "mYH7NfMX1HT2uzVNGh4O9XwFlhD2",
//       email: "moi5@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/profile/1756392601188_20240124_162150.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/mYH7NfMX1HT2uzVNGh4O9XwFlhD2/cover/1755716803839_20250805_211206.jpg",
//       location: { city: "Loum", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "Kamwa",
//       lastName: "Ronald",
//       speciality: "MEDICAL_DOCTORS",
//       professionalTitle: "Director CHU of Bamenda",
//       bio: "I am the director of CHU of Douala",
//       slug: "kamwa-ronald",
//     },
//     {
//       id: "68aee292091871192c6d14ec",
//       firebaseUid: "SPtsjfuVERNUlFKGwskPu9a4ngH3",
//       email: "kingkoumetio29.kck@gmail.com",
//       profilePicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/profile/1756291669942_IMG-20250827-WA0050.jpg",
//       coverPicUrl:
//         "https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/public/SPtsjfuVERNUlFKGwskPu9a4ngH3/cover/1756291669953_adobestock_322540144-taille1200_6464a7afd9af5_0.jpg",
//       location: { city: "Douala", stateOrProvince: "Littoral", country: "Cameroon" },
//       userType: "INDIVIDUAL",
//       firstName: "KING",
//       lastName: "KOUMETIO",
//       speciality: "NURSES",
//       professionalTitle: "Directeur MALATITI",
//       bio: "KING KOUME\nTHE CRAZY NURSE",
//       slug: "king-koume",
//     },
// ]

  useEffect(() => {
    if (updatedRequest) {
      refetchPending();
    //   refetchAccepted();
    }
  }, [updatedRequest]);

  const loading = loadingPending || loadingSuggestions ;

  return (
    <FriendsDesktopView
      pending={pendingRequests}
      me={user ?? undefined}
      suggested={suggestedFriends}
      // accepted={acceptedRequests}
      loading={loading}
    />
  );
}
