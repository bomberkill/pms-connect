"use client"
import { Trash2, Plus, File, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useMemo, useState } from "react"
import { getIn, useFormik } from "formik"
import * as yup from "yup"
import { useAppDispatch, useDictionary, useNotification } from "@/lib/hooks"
import { googleProvider, register, signInWithGoogle } from "@/graphql/firebaseAuth"
import {
  CreateUserInput,
  EntityTypeGQL,
  SpecialityGQL,
  UserTypeGQL,
} from "@/types/User"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "./ui/textarea"
import { deleteUser, getRedirectResult, signInWithRedirect, User } from "firebase/auth"
// import {CitySelect, CountrySelect, StateSelect} from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css"
// import { City, Country, State } from "react-country-state-city/dist/esm/types"
import { auth } from "@/lib/firebase"
// import { ICity, ICountry, IState } from "country-state-city"
// import { Country, State, City }  from 'country-state-city';
import { Combobox } from "./Combobox"
import { City, Country, State } from "@/types/Location"
import data from "../../public/countries.json"
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createUser } from "@/redux/services/userService"
// import { createClient } from '@supabase/supabase-js'
import { FirebaseError } from "firebase/app"
import { gql, useApolloClient } from "@apollo/client"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Image from "next/image"
import CustomLoader from "./Loader"
// import { setPersistence, browserLocalPersistence } from "firebase/auth";


export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
interface AccreditationPreviewItem {
  url: string; // Object URL for preview (image data URL or object URL for PDF thumbnail)
  name?: string; // File name
  type?: string; // File type (e.g., 'application/pdf', 'image/png')
}
export const uploadFileToSupabase = async (
  file: File,
  path: string,
  bucket = "pms-connect-bucket" // default bucket name
): Promise<{ publicUrl: string, uploadedPath: string } | null> => {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${path}/${fileName}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file);
  if (error) {
    console.error("Upload failed:", error.message);
    return null;
  }

  // uploadedPaths.push(filePath);
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return {publicUrl: publicUrlData.publicUrl, uploadedPath: filePath};
};


export function RegisterForm({
    className,
  ...props
}: React.ComponentProps<"div">) {
  const dispatch = useAppDispatch()
  const dict = useDictionary()
  const client = useApolloClient();
  const { open } = useNotification()
  const [currentStep, setCurrentStep] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false)
  const [googleUser, setGoogleUser] = useState<User | null>(null); 
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [coverPicPreview, setCoverPicPreview] = useState<string | null>(null);
  const [accreditationsPreview, setAccreditationsPreview] = useState<AccreditationPreviewItem[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const router = useRouter()
  // const [countries, setCountries] = useState<ICountry[]>([])
  // const [states, setStates] = useState<IState[]>([])
  // const [cities, setCities] = useState<ICity[]>([])
  

  const initialValues: CreateUserInput & { password?: string; confirmPassword?: string; profilePicFile: File | null, coverPicFile: File | null, accreditationsFile: File[] } = {
    email: "",
    userType: UserTypeGQL.INDIVIDUAL, // Default to individual
      password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    professionalTitle: "",
    speciality: SpecialityGQL.MEDICAL_DOCTORS, // Default speciality
    entityName: "",
    entityType: EntityTypeGQL.HOSPITAL, // Default entity type
    bio: "",
      profilePicUrl: "",
      coverPicUrl: "",
      websiteUrl: "",
    location: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      stateOrProvince: "",
      postalCode: "",
      country: "",
    },
    professionalAccreditation: [],
    accreditationsFile: [],
    profilePicFile: null,
    coverPicFile: null,
  }

  const validationSchemas = useMemo(() => [
    // Step 0: Credentials
    yup.object().shape({
      email: yup.string()
        .email(dict.validation.email.invalid)
        .required(dict.validation.email.required),
      password: yup.string().when([], {
        is: () => googleUser === null,
        then: schema => schema.min(6, dict.validation.password.min).required(dict.validation.password.required),
        otherwise: schema => schema.notRequired(),
      }),
      confirmPassword: yup.string().when([], {
          is: () => googleUser === null,
          then: schema => schema.oneOf([yup.ref('password')], dict.register.passwordsDoNotMatch).required(dict.validation.password.required),
          otherwise: schema => schema.notRequired()
      })
    }),
    // Step 1: Account Type
    yup.object().shape({
      userType: yup.string().oneOf(Object.values(UserTypeGQL)).required(dict.register.userTypeLabel),
    }),
    // Step 2: Personal/Entity Details
    yup.object().shape({
      firstName: yup.string().when('userType', {
        is: UserTypeGQL.INDIVIDUAL,
        then: (schema) => schema.required(dict.register.firstNameLabel),
        otherwise: (schema) => schema.notRequired(),
      }),
      lastName: yup.string().when('userType', {
        is: UserTypeGQL.INDIVIDUAL,
        then: (schema) => schema.required(dict.register.lastNameLabel),
        otherwise: (schema) => schema.notRequired(),
      }),
      professionalTitle: yup.string().when("userType", {
        is: UserTypeGQL.INDIVIDUAL,
        otherwise: (schema) => schema.notRequired(),
      }),
      speciality: yup.string().when('userType', {
        is: UserTypeGQL.INDIVIDUAL,
        then: (schema) => schema.oneOf(Object.values(SpecialityGQL)).required(dict.register.specialityLabel),
        otherwise: (schema) => schema.notRequired(),
      }),
      entityName: yup.string().when('userType', {
        is: UserTypeGQL.LEGAL_ENTITY,
        then: (schema) => schema.required(dict.register.entityNameLabel),
        otherwise: (schema) => schema.notRequired(),
      }),
      entityType: yup.string().when('userType', {
        is: UserTypeGQL.LEGAL_ENTITY,
        then: (schema) => schema.oneOf(Object.values(EntityTypeGQL)).required(dict.register.entityTypeLabel),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    // Step 3: Optional Profile & Location
    yup.object().shape({
      profilePicFile: yup
      .mixed()
      .notRequired()
      .test("fileType", dict.validation.file.unsupported, (value) => {
        if (!value) return true;
        const file = value as File;
        return ["image/jpeg", "image/png"].includes(file.type);
      })
      .test("fileSize", dict.validation.file.tooLarge, (value) => {
        if (!value) return true;
        const file = value as File;
        return file.size <= MAX_FILE_SIZE;
      }),

    coverPicFile: yup
      .mixed()
      .notRequired()
      .test("fileType", dict.validation.file.unsupported, (value) => {
        if (!value) return true;
        const file = value as File;
        return ["image/jpeg", "image/png"].includes(file.type);
      })
      .test("fileSize", dict.validation.file.tooLarge, (value) => {
        if (!value) return true;
        const file = value as File;
        return file.size <= MAX_FILE_SIZE;
      }),

    accreditationsFile: yup
      .array()
      .of(
        yup
          .mixed()
          .required(dict.validation.file.required)
          .test("fileType", dict.validation.file.onlyPDF, (value) => {
            if (!value) return false; // Must exist here
            const file = value as File;
            return file.type === "application/pdf";
          })
          .test("fileSize", dict.validation.file.tooLarge, (value) => {
            if (!value) return false;
            const file = value as File;

            return file.size <= MAX_FILE_SIZE;
          })
      )
      .min(1, dict.validation.file.min)
      .max(2, dict.validation.file.max)
      .required(dict.validation.file.atLeast),
      bio: yup.string().notRequired(),
      websiteUrl: yup.string().url(dict.validation.websiteUrl.invalidUrl).notRequired(),
      location: yup.object().shape({
        country: yup.string().required(dict.validation.country.required),
        stateOrProvince: yup.string().required(dict.validation.state.required),
        city: yup.string().required(dict.validation.city.required),
      }),
    }),
  ], [googleUser, dict])


  const uploadedPaths: string[] = [];

  let firebaseUser: User;
  const formik = useFormik({
    initialValues,
    validationSchema: validationSchemas[currentStep],
    // We need to re-validate when moving between steps
    validateOnChange: true,
    validateOnBlur: false,
    onSubmit: async (values) => {
      // Step 0 -> 1: Email and Password step
      if (currentStep === 0) {
        setIsLoading(true);
        try {
          const { data } = await client.query<{
            checkUserExistsByEmail: { exists: boolean; hasPassword: boolean; providers: string[] };
          }>({
            query: gql`
              query CheckUserExistsByEmail($email: String!) {
                checkUserExistsByEmail(email: $email) {
                  exists
                  hasPassword
                  providers
                }
              }
            `,
            variables: { email: values.email },
            fetchPolicy: "network-only",
          });
          if (data.checkUserExistsByEmail.exists) {
            // Email already exists
            formik.setFieldError('email', dict.validation.email.alreadyInUse);
            // open("info", "Email déjà utilisé", { message: "Cet email est déjà associé à un compte. Veuillez vous connecter." });
          } else {
            // Email is available, proceed to next step
            setCurrentStep(currentStep + 1);
          }
        } catch (error: unknown) {
          console.error("Error checking email:", error);
          open("error", "Erreur de vérification", { message: error instanceof Error ? error.message : "Impossible de vérifier l'e-mail pour le moment." });
        } finally {
          setIsLoading(false);
        }
      } else if (currentStep < validationSchemas.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final submission
        setIsLoading(true)
        try {
          const { email, password, userType, firstName, lastName, speciality, entityName, entityType, bio, websiteUrl, location, profilePicFile, coverPicFile, accreditationsFile, professionalTitle } = values;

          // Étape 1: S'assurer que l'utilisateur Firebase existe et récupérer ses données.
          if (googleUser) {
            // L'utilisateur s'est déjà connecté avec Google.
            firebaseUser = googleUser;
          } else if (password) {
            // Nouvel utilisateur s'inscrivant avec email et mot de passe.
            firebaseUser = await register(email, password);
          } else {
            // Ce cas ne devrait pas se produire si la validation est correcte.
            throw new Error("Aucun mot de passe fourni et non connecté avec Google.");
          }
          
          const uid = firebaseUser.uid;
          const [
            uploadedProfilePicUrl,
              uploadedCoverPicUrl,
              uploadedAccreditations
          ] = await Promise.all([
            profilePicFile
              ? uploadFileToSupabase(profilePicFile, `public/${uid}/profile`).then(url => {
                  if (url?.uploadedPath) uploadedPaths.push(url.uploadedPath);
                  return { publicUrl: url?.publicUrl ?? "" };
                })
              : Promise.resolve(undefined),

            coverPicFile
              ? uploadFileToSupabase(coverPicFile, `public/${uid}/cover`).then(url => {
                  if (url?.uploadedPath) uploadedPaths.push(url.uploadedPath);
                  return { publicUrl: url?.publicUrl ?? "" };
                })
              : Promise.resolve(undefined),

            accreditationsFile?.length > 0
              ? Promise.all(
                  accreditationsFile.map(file =>
                    uploadFileToSupabase(file, `private/${uid}/accreditations`).then(url => {
                      if (url?.uploadedPath) uploadedPaths.push(url.uploadedPath);
                      return { documentUrl: url?.publicUrl ?? "" };
                    })
                  )
                )
              : Promise.resolve([]),
              ]);
          // Étape 3: Préparation des données pour votre backend
          const userData: CreateUserInput = {
            email,
            userType,
            bio: bio || undefined,
            websiteUrl: websiteUrl || undefined,
            location,
            profilePicUrl: uploadedProfilePicUrl?.publicUrl ?? "",
            coverPicUrl: uploadedCoverPicUrl?.publicUrl ?? "",
            professionalAccreditation: uploadedAccreditations as { documentUrl: string }[],
            ...(userType === UserTypeGQL.INDIVIDUAL && {
              firstName,
              lastName,
              speciality,
              professionalTitle
            }),
            ...(userType === UserTypeGQL.LEGAL_ENTITY && {
              entityName,
              entityType,
            }),
          };

          console.log("✅ Final User Payload:", userData);

          await dispatch(createUser(userData)).unwrap();
          
          open("success", dict.notifications.register.success.title, {
            message: dict.notifications.register.success.message,
          });

          router.push('/login'); // Rediriger vers la page de connexion après l'inscription réussie 

        } catch (error: unknown) {
          console.log("Errors , uploadedPaths:", uploadedPaths);
          console.error("Registration error:", error);
          let errorMessage: string = dict.notifications.register.error.message; // Message par défaut
          if (error instanceof FirebaseError) { // Gestion spécifique des erreurs Firebase
            switch (error.code) {
              case 'auth/email-already-in-use':
                errorMessage = dict.validation.email.alreadyInUse || "Cette adresse e-mail est déjà utilisée.";
                break;
              case 'auth/weak-password':
                errorMessage = dict.validation.password.weak || "Le mot de passe est trop faible.";
                break;
              default:
                errorMessage = error.message;
            }
          } else if (error instanceof Error) {
            // Erreur provenant du thunk createUser ou d'une autre partie
            errorMessage = error.message;
          }
          if (uploadedPaths.length) {
            // console.log("Suppression des fichiers Supabase...");
            try {
              const { error: removeErr } = await supabase.storage.from("pms-connect-bucket").remove(uploadedPaths);
              if (removeErr) console.error("Erreur lors de la suppression Supabase:", removeErr.message);
              else console.log("Fichiers Supabase supprimés");
            } catch (err) {
              console.error("Rollback Supabase failed:", err);
            }
          }
          if (firebaseUser) {
            console.log("Suppression de l'utilisateur Firebase...");
            try {
              await deleteUser(firebaseUser);
              console.log("Utilisateur Firebase supprimé");
            } catch (err) {
              console.error("Impossible de supprimer l'utilisateur Firebase:", err);
            }
          }
          open("error", dict.notifications.register.error.title, { message: errorMessage });
        } finally {
          setIsLoading(false);
        }
      }
    },
  })

  const countryError = getIn(formik.errors, "location.country");
  const countryTouched = getIn(formik.touched, "location.country");
  const stateError = getIn(formik.errors, "location.stateOrProvince");
  const stateTouched = getIn(formik.touched, "location.stateOrProvince");
  const cityError = getIn(formik.errors, "location.city");
  const cityTouched = getIn(formik.touched, "location.city");

  // useEffect(() => {
  //   setCountries(Country.getAllCountries())
  //   setStates(State.getAllStates())
  //   setCities(City.getAllCities())
  // }, []);
  useEffect(() => {
    if (!googleUser) {
      formik.setValues({
        ...formik.values,
          email: "",
        profilePicUrl:"",
        firstName: "",
        lastName: "",
      }); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleUser]);

  useEffect(() => {
    const handleRedirectResult = async () => {
      console.log("Handling redirect result...");
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Google redirect result success");
          // User signed in successfully
          // const credential = googleProvider.credentialFromResult(result);
          // const token = credential.accessToken;
          const user = result.user;
          setGoogleUser(user);
          // Handle user data and token
        } else {
          console.log("No redirect result available.");
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
        // Handle errors (e.g., user cancelled sign-in)
      }
    };

    handleRedirectResult();
  }, []);
  const handleGoogleSignIn = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsGoogleSignIn(true);
    try {
      if (isMobile) {
        // await setPersistence(auth, browserLocalPersistence);
        await signInWithRedirect(auth, googleProvider);
      }else {
        const result = await signInWithGoogle();
        // open("success", "Signed in with Google!", { message: "Please complete your profile to continue." });
        // setCurrentStep(1);
        if (result) {
          // Populate formik values with Google user data
          setGoogleUser(result);
          formik.setValues({
            ...formik.values,
            email: result.email ?? "",
            password: "",
            confirmPassword: "",
            profilePicUrl: result.photoURL || "",
            firstName: result.displayName?.split(" ")[0] || "",
            lastName: result.displayName?.split(" ")[1] || "",
            // userType: UserTypeGQL.INDIVIDUAL, // Default to individual for Google sign-in
          });
          
          // Move to next step after Google sign-in
          open("success", dict.notifications.register.success.googleAccount.title, { message: dict.notifications.register.success.googleAccount.message });
          // setCurrentStep(1);
          
        }
      }
      
    } catch (error: unknown) {
      console.error("Google sign-in error:", error);
    }finally {
      setIsGoogleSignIn(false);
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col gap-6 min-w-full xs:min-w-full sm:min-w-3/5 md:min-w-2/5">
            <div className="grid gap-1">
              <Label htmlFor="email">{dict.register.emailLabel}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                onChange={(event) => {
                  formik.handleChange(event);
                  if(googleUser) {
                    setGoogleUser(null);
                  }
                }}
                onBlur={formik.handleBlur} value={formik.values.email}
              />
              {formik.touched.email && formik.errors.email && <p className="text-red-500 text-xs">{formik.errors.email}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">{dict.register.passwordLabel}</Label>
              <Input id="password" name="password" type="password" placeholder="password" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.password} disabled={googleUser !== null} />
              {formik.touched.password && formik.errors.password && <p className="text-red-500 text-xs">{formik.errors.password}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="confirmPassword">{dict.register.confirmPasswordLabel}</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="confirm password" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.confirmPassword} disabled={googleUser !== null} />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && <p className="text-red-500 text-xs">{formik.errors.confirmPassword}</p>}
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-background relative z-10 px-3">
                <Button type="button" size="icon" variant="outline" onClick={handleGoogleSignIn} className="rounded-full shadow-gray-200 border border-gray-200">
                  <Image src="/google-color.svg" alt="Google" width={4} height={4} className="h-4 w-4" />
                  <span className="sr-only">{dict.login.googleButton}</span>
                {/* {dict.login.googleButton} */}
                </Button>
              </span>
            </div>
          </div>
        )
      case 1:
        return (
          <div className="flex flex-col gap-6 w-full sm:max-w-4/5 md:max-w-3/5 ">
            {/* <Label className="mb-2" htmlFor="userType">{dict.register.userTypeLabel}</Label> */}
            <RadioGroup onValueChange={(value) => formik.setFieldValue('userType', value)} value={formik.values.userType}>
              <label htmlFor="option-one" className="flex cursor-pointer items-center space-x-2 p-5 border border-gray-200 rounded-md">
                <RadioGroupItem value={UserTypeGQL.INDIVIDUAL} id="option-one" />
                <div className="flex flex-col gap-0 md:gap-1">
                  <span className="text-sm font-medium">{dict.register.individual}</span>
                  <span className="text-xs text-muted-foreground font-medium">{dict.register.individualDescription}</span>
                </div>
              </label>
              <label htmlFor="option-two" className="flex cursor-pointer items-center space-x-2 p-5 border border-gray-200 rounded-md">
                <RadioGroupItem value={UserTypeGQL.LEGAL_ENTITY} id="option-two" />
                <div className="flex flex-col gap-0 md:gap-1">
                  <span className="text-sm font-medium">{dict.register.legalEntity}</span>
                  <span className="text-xs text-muted-foreground font-medium">{dict.register.legalEntityDescription}</span>
                </div>
              </label>
            </RadioGroup>
          </div>
        )
      case 2:
        return (
          <div className="w-full xs:max-w-4/5 sm:max-w-3/5 md:max-w-2/5">
            {/* <div>
                <h2 className="text-xl font-bold">{dict.register.step2Title}</h2>
                <p className="text-muted-foreground text-sm">{dict.register.step2Description}</p>
            </div> */}
            {formik.values.userType === UserTypeGQL.INDIVIDUAL ? (
              <div className="max-w-full flex flex-col gap-6">
                <div className="flex items-start gap-3">
                  <div className="grid gap-1 w-full">
                    <Label htmlFor="firstName">{dict.register.firstNameLabel}</Label>
                    <Input id="firstName" name="firstName" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.firstName} />
                    {formik.touched.firstName && formik.errors.firstName && <p className="text-red-500 text-xs">{formik.errors.firstName}</p>}
                  </div>
                  <div className="grid gap-1 w-full">
                    <Label htmlFor="lastName">{dict.register.lastNameLabel}</Label>
                    <Input id="lastName" name="lastName" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.lastName} />
                    {formik.touched.lastName && formik.errors.lastName && <p className="text-red-500 text-xs">{formik.errors.lastName}</p>}
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="speciality">{dict.register.specialityLabel}</Label>
                  <Select onValueChange={(value) => formik.setFieldValue('speciality', value)} value={formik.values.speciality}>
                    <SelectTrigger className="min-w-full" id="speciality">
                      <SelectValue placeholder={dict.register.specialityLabel} />
                    </SelectTrigger>
                    <SelectContent>
                    {Object.entries(SpecialityGQL).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {dict.specialities[key as keyof typeof dict.specialities]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.speciality && formik.errors.speciality && <p className="text-red-500 text-xs">{formik.errors.speciality}</p>}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="professionalTitle">{dict.register.professionalTitleLabel}</Label>
                  <Input id="professionalTitle" name="professionalTitle" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.professionalTitle} />
                </div>
              </div>
            ) : (
              <div className="max-w-full flex flex-col gap-6">
                <div className="grid gap-1">
                  <Label htmlFor="entityName">{dict.register.entityNameLabel}</Label>
                  <Input id="entityName" name="entityName" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.entityName}/>
                  {formik.touched.entityName && formik.errors.entityName && <p className="text-red-500 text-xs">{formik.errors.entityName}</p>}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="entityType">{dict.register.entityTypeLabel}</Label>
                  <Select onValueChange={(value) => formik.setFieldValue('entityType', value)} value={formik.values.entityType}>
                    <SelectTrigger className="w-full" id="entityType">
                      <SelectValue placeholder={dict.register.entityTypeLabel} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EntityTypeGQL).map(([key, value]) => 
                        <SelectItem key={key} value={value}>{dict.entityTypes[key as keyof typeof dict.entityTypes]}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {formik.touched.entityType && formik.errors.entityType && <p className="text-red-500 text-xs">{formik.errors.entityType}</p>}
                </div>
              </div>
            )}
          </div>
        )
      case 3:
        return (
          <div className="w-full flex flex-col gap-6 xs:max-w-4/5 sm:max-w-3/5 md:max-w-5/10">
            <div className="grid gap-2">
              <Label htmlFor="bio">{dict.register.bioLabel}</Label>
              <Textarea id="bio" name="bio" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.bio}/>
            </div>
            <div className="grid gap-2">
              <Label>{dict.register.uploadProfilePic}</Label>
                <div className="flex justify-center items-center border-2 border-gray-200 border-dashed h-40 w-full rounded-md">
                  {profilePicPreview ? 
                    (
                      <div className="relative">
                        <Image src={profilePicPreview} alt="Profile preview" width={32} height={32} className="h-32 w-32 rounded-full object-cover relative"/>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className=" cursor-pointer absolute top-2 right-2 h-6 w-6 bg-background/80 rounded-full"
                          onClick={() => {
                            setProfilePicPreview(null)
                            formik.setFieldValue("profilePicFile", null);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500"  />
                        </Button> 
                      </div>
                    )
                  : (
                    <div className="flex flex-col justify-center items-center gap-5">
                      <div className="flex flex-col justify-center items-center gap-1">
                        <Label className="text-sm font-medium">{dict.register.uploadProfilePic}</Label>
                        <Label className="text-xs text-muted-foreground font-medium">{dict.register.uploadProfilePic}</Label>
                      </div>
                      <label htmlFor="profilePicFile">
                        <div className="rounded-sm bg-gray-200 py-1 px-3 cursor-pointer hover:bg-gray-300 transition-colors">
                          <span className="text-xs font-medium">Upload</span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              <Input 
                id="profilePicFile"
                name="profilePicFile"
                type="file"
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  formik.setFieldValue("profilePicFile", file);
                  setProfilePicPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              {formik.touched.profilePicFile && formik.errors.profilePicFile && <p className="text-red-500 text-xs">{formik.errors.profilePicFile}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coverPicFile">{dict.register.uploadCoverPic}</Label>
              <div className="flex justify-center items-center border-2 border-gray-200 border-dashed h-40 w-full rounded-md">
                {coverPicPreview ? 
                  (
                    <div className="relative w-full h-40">
                      <Image src={coverPicPreview} alt="Cover preview" fill className="h-40 w-full rounded-md object-cover relative"/>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className=" cursor-pointer absolute top-2 right-2 h-6 w-6 bg-background/80 rounded-full"
                        onClick={() => {
                          setCoverPicPreview(null)
                          formik.setFieldValue("coverPicFile", null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500"  />
                      </Button> 
                    </div>
                  )
                : (
                  <div className="flex flex-col justify-center items-center gap-5">
                    <div className="flex flex-col justify-center items-center gap-1">
                      <Label className="text-sm font-medium">{dict.register.uploadProfilePic}</Label>
                      <Label className="text-xs text-muted-foreground font-medium">{dict.register.uploadProfilePic}</Label>
                    </div>
                    <label htmlFor="coverPicFile">
                      <div className="rounded-sm bg-gray-200 py-1 px-3 cursor-pointer hover:bg-gray-300 transition-colors">
                        <span className="text-xs font-medium">Upload</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>
              <Input className="hidden" id="coverPicFile" name="coverPicFile" type="file" accept="image/png, image/jpeg" onChange={(event) => {
                const file = event.currentTarget.files?.[0] ;
                formik.setFieldValue("coverPicFile", file);
                setCoverPicPreview(file ? URL.createObjectURL(file) : null);
              }}/>
              {formik.touched.coverPicFile && formik.errors.coverPicFile && <p className="text-red-500 text-xs">{formik.errors.coverPicFile}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="websiteUrl">{dict.register.websiteUrlLabel}</Label>
              <Input id="websiteUrl" name="websiteUrl" type="url" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.websiteUrl} />
              {formik.touched.websiteUrl && formik.errors.websiteUrl && <p className="text-red-500 text-xs">{formik.errors.websiteUrl}</p>}
            </div>
            <div className="grid gap-2">
              <Label >{dict.register.professionalAccreditations}</Label>
              <div className="flex justify-center items-center border-2 border-gray-200 border-dashed h-40 w-full rounded-md">
                  {accreditationsPreview.length > 0 ? 
                  (
                    <div className="flex px-2 flex-col justify-center gap-5 items-center w-full h-full">
                      <div className="flex flex-col justify-center items-start gap-2">
                        {accreditationsPreview.map((accreditation, index) => (
                          <div key={index} className="flex justify-center items-center gap-2 relative">
                            {/* <Image src={accreditation.url} alt="Cover preview" className="h-40 w-full rounded-md object-cover relative"/> */}
                            <File className="w-7 h-7  p-1 bg-gray-200 rounded-sm relative"/>
                            <span className="text-sm">{accreditation.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className=" cursor-pointer h-6 w-6 bg-background/80 rounded-full"
                              onClick={() => {
                                formik.setFieldValue('accreditationsFile', formik.values.accreditationsFile.filter((_, i) => i !== index))
                                setAccreditationsPreview(prev => prev.filter((_, i) => i !== index))
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500"  />
                            </Button> 
                          </div>
                        ))}
                      </div>
                      <div className={accreditationsPreview.length < 2 ? "block" : "hidden"}>
                        <label htmlFor="accreditations-input">
                          <div className="rounded-sm bg-gray-200 p-1 cursor-pointer hover:bg-gray-300 transition-colors">
                            <Plus />
                          </div>
                        </label>
                      </div>
                    </div>
                  )
                : (
                  <div className="flex flex-col justify-center items-center gap-5">
                    <div className="flex flex-col justify-center items-center gap-1">
                      <Label className="text-sm font-medium">{dict.register.uploadProfilePic}</Label>
                      <Label className="text-xs text-muted-foreground font-medium">{dict.register.uploadProfilePic}</Label>
                    </div>
                    <label htmlFor="accreditations-input">
                      <div className="rounded-sm bg-gray-200 py-1 px-3 cursor-pointer hover:bg-gray-300 transition-colors">
                        <span className="text-xs font-medium">Upload</span>
                      </div>
                    </label>
                  </div>
                )}
                <Input
                  id="accreditations-input"
                  name="accreditationsFile" 
                  multiple
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files || []);
                    console.log(formik.values.accreditationsFile, " :accreditationsFile");
                    if (files.length > 0) {
                      formik.setFieldValue('accreditationsFile', [...formik.values.accreditationsFile, ...files]);
                      console.log(formik.values.accreditationsFile, "accreditationsFile: ", [...formik.values.accreditationsFile, ...files] );
                      const newPreviews = files.map(file => ({ url: URL.createObjectURL(file), name: file.name, type: file.type }));
                      setAccreditationsPreview(prev => [...prev, ...newPreviews]);
                    }
                  }}
                  disabled={accreditationsPreview.length >= 2} // Disable if already 2 files
                />
              </div>
              {formik.touched.accreditationsFile && formik.errors.accreditationsFile && <p className="text-red-500 text-xs">{formik.errors.accreditationsFile.toString()}</p>}
            </div>
            {/* <h3 className="text-lg font-semibold">Location</h3> */}
            <div className="grid gap-1 w-full">
              <Label htmlFor="country">{dict.register.countryLabel}</Label>
              {/* <Input id="country" name="location.country" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.location?.country} disabled={isLoading} /> */}
              <Combobox<Country>
                id="country"
                name="location.country"
                data={data}
                error={countryError}
                touched={countryTouched}
                onBlur={formik.handleBlur}
                value={formik.values.location?.country}
                onChange={(country) => {
                  setSelectedCountry(country);
                  console.log("selectedCountry: ", country)
                  formik.setFieldValue('location.country', country.name)
                }
                } 
                placeholder="Select Country"
                // disabled={isLoading} 
              />
              {/* {formik.touched.location?.country && formik.errors.location?.country && <p className="text-red-500 text-xs">{formik.errors.location.country}</p>} */}
              {countryTouched && countryError && (
                <p className="text-red-500 text-xs">{countryError}</p>
              )}
            </div>
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="grid gap-1 w-full">
                <Label htmlFor="stateOrProvince">{dict.register.stateOrProvinceLabel}</Label>
                {/* <Input id="stateOrProvince" name="location.stateOrProvince" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.location?.stateOrProvince} disabled={isLoading} /> */}
                <Combobox<State>
                  data={selectedCountry ? selectedCountry.states || [] : []}
                  placeholder="Select State"
                  id="stateOrProvince"
                  name="location.stateOrProvince"
                  value={formik.values.location?.stateOrProvince}
                  onBlur={formik.handleBlur}
                  // disabled={isLoading}
                  onChange={(state) => {
                    setSelectedState(state)
                    console.log("selectedState: ", state)
                    formik.setFieldValue("location.stateOrProvince", state.name)
                  }}
                />
                {stateTouched && stateError && (
                  <p className="text-red-500 text-xs">{stateError}</p>
                )}
              </div>
              <div className="grid gap-1 w-full">
                <Label htmlFor="city">{dict.register.cityLabel}</Label>
                {/* <Input id="city" name="location.city" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.location?.city} disabled={isLoading} /> */}
                <Combobox<City>
                  data={selectedState ? selectedState.cities || [] : []}
                  onBlur={formik.handleBlur}
                  id="city"
                  name="location.city"
                  value={formik.values.location?.city}
                  onChange={(city) => {
                    // setSelectedCity(city);
                    console.log("selectedcity: ", city)
                    formik.setFieldValue('location.city', city.name)
                  }} 
                  placeholder="Select City"
                  // disabled={isLoading}
                />
                {cityTouched && cityError && (
                  <p className="text-red-500 text-xs">{cityError}</p>
                )}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }


  return (
    <div className={cn("py-10", className)} {...props}>
      {(isGoogleSignIn || isLoading) && <CustomLoader/>}
      <form onSubmit={formik.handleSubmit} className="w-full" >
        <div className="flex flex-col items-center mb-5 text-center">
          <h1 className="text-2xl font-bold">{dict.register.title}</h1>
          <p className="text-muted-foreground text-sm text-balance">{dict.register.description}</p>
        </div>
        <div className="flex flex-col min-h-100 items-center justify-start gap-8">
          {renderStep()}
          <div className="flex items-center justify-between gap-4">
            {currentStep > 0 && (
              <Button className="w-35" type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                {dict.register.previous}
              </Button>
            )}
            <Button className="w-35" type="submit">
              {(currentStep < validationSchemas.length - 1 ? dict.register.next : dict.register.registerButton)}
            </Button>
          </div>
        </div>
      </form>
      {/* <div className="text-center text-sm">
        {dict.register.alreadyHaveAccount}{" "}
        <Link href="/login" className="underline underline-offset-4">
          {dict.login.loginButton}
        </Link>
      </div> */}
    </div>
  )
}
