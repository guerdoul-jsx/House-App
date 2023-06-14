import { useState, useEffect, ChangeEvent, MouseEvent, FormEvent } from "react";
import Spinner from "../components/Spinner";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { nanoid } from "nanoid";
import {
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
  collection,
  FieldValue,
} from "firebase/firestore";

import { db } from "../firebase.config";

export type formDataCopyType = {
  imgUrls: void | unknown[];
  location: string;
  timestamp: FieldValue;
  userRef?: string | undefined;
  type: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  parking: boolean;
  furnished: boolean;
  address?: string;
  offer: boolean;
  regularPrice: number;
  discountedPrice?: number;
  images?: string[];
  geolocation: {
    lat: number;
    lng: number;
  };
};

type CreateListingProps = {
  userRef?: string;
  type: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  parking: boolean;
  furnished: boolean;
  address: string;
  offer: boolean;
  regularPrice: number;
  discountedPrice: number;
  images: string[];
  geolocation: {
    lat: number;
    lng: number;
  };
};

const defaultState: CreateListingProps = {
  type: "rent",
  name: "",
  bedrooms: 1,
  bathrooms: 1,
  parking: false,
  furnished: false,
  address: "",
  offer: false,
  regularPrice: 0,
  discountedPrice: 0,
  images: [],
  geolocation: {
    lat: 0,
    lng: 0,
  },
};

const EditListing = () => {
  const [updateListing, setUpdateListing] = useState<CreateListingProps | null>(
    null
  );
  const [formData, setFormData] = useState(defaultState);
  const [geoLocationEnabled, setGeoLocationEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { listingId } = useParams();

  const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    offer,
    regularPrice,
    discountedPrice,
    images,
    geolocation,
  } = formData;

  const { lat, lng } = geolocation;

  const auth = getAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);

    if (discountedPrice >= regularPrice) {
      setIsLoading(false);
      toast.error("Discount Price Must Be Less Than Regular Price");
      return;
    }

    if (images.length >= 6) {
      setIsLoading(false);
      toast.error("The Images Must Me less than 6");
      return;
    }

    let location = "";

    if (geoLocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GOOGLE_GEO_CODING_API_KEY}`
      );

      const data = await response.json();

      geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
      geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;

      console.log(data);

      location =
        data.status === "ZERO_RESULTS"
          ? undefined
          : data.results[0]?.formatted_address;

      if (location === undefined || location.includes("undefined")) {
        setIsLoading(false);
        toast.error("Please enter a correct address");
        return;
      }
    } else {
      geolocation.lat = lat;
      geolocation.lng = lng;
    }

    // TODO: Parms image need a type
    const storeImage = async (image: any) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const fileName = `${auth.currentUser?.uid}-${image.name}-${nanoid()}`;

        const storageRef = ref(storage, "images/" + fileName);
        const uploadTask = uploadBytesResumable(storageRef, image);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
            }
          },
          (error) => {
            // Handle unsuccessful uploads
            reject(error);
          },
          () => {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              console.log("File available at", downloadURL);
              resolve(downloadURL);
            });
          }
        );
      });
    };
    const imgUrls = await Promise.all(
      [...images].map((image) => storeImage(image))
    ).catch(() => {
      setIsLoading(false);
      toast.error("Images not uploaded");
      return;
    });

    const formDataCopy: formDataCopyType = {
      ...formData,
      imgUrls,
      location,
      timestamp: serverTimestamp(),
    };

    formDataCopy.location = address;

    delete formDataCopy.images;
    delete formDataCopy.address;
    !formDataCopy.offer && delete formDataCopy.discountedPrice;

    const docRef = doc(db, "listings", listingId as string);
    await updateDoc(docRef, formDataCopy);
    toast.success("Listing Updated SuccessFully");
    setFormData(defaultState);
    navigate(`/category/${formDataCopy.type}/${(await docRef).id}`);
  };

  // TODO: Parms e need a type
  const onMutate = (e: any) => {
    let boolean: boolean | null = null;

    if (e.target.value === "true") {
      boolean = true;
    }
    if (e.target.value === "false") {
      boolean = false;
    }

    // Files
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        images: e.target.files,
      }));
    }

    // Text/Booleans/Numbers
    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setFormData({ ...formData, userRef: user.uid });
      } else {
        navigate("/sign-in");
      }
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const fetchUpdateListing = async () => {
      try {
        const docRef = doc(db, "listings", listingId as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUpdateListing(docSnap.data() as CreateListingProps);
          setFormData({
            ...(docSnap.data() as CreateListingProps),
            address: docSnap.data().location,
          });
          setIsLoading(false);
          console.log("number 269", updateListing);
        } else {
          navigate("/");
        }
      } catch (error) {
        toast.error("Can get the listing");
      }
    };

    fetchUpdateListing();
  }, [listingId]);

  console.log("USER: ", auth.currentUser?.uid);
  console.log("Listing to update", updateListing);

  //?! Check the listing if it's created By The Current User

  useEffect(() => {
    if (updateListing && updateListing.userRef !== auth.currentUser?.uid) {
      toast.error("You are not the owner of this Listing");
      navigate("/");
    }
  }, []);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="profile">
      <header>
        <p className="pageHeader">Edit Listing</p>
      </header>

      <main>
        <form onSubmit={handleSubmit}>
          <label className="formLabel">Sell / Rent</label>
          <div className="formButtons">
            <button
              type="button"
              className={type === "sale" ? "formButtonActive" : "formButton"}
              id="type"
              value="sale"
              onClick={onMutate}
            >
              Sell
            </button>
            <button
              type="button"
              className={type === "rent" ? "formButtonActive" : "formButton"}
              id="type"
              value="rent"
              onClick={onMutate}
            >
              Rent
            </button>
          </div>

          <label className="formLabel">Name</label>
          <input
            className="formInputName"
            type="text"
            id="name"
            value={name}
            onChange={onMutate}
            maxLength={32}
            minLength={10}
            required
          />

          <div className="formRooms flex">
            <div>
              <label className="formLabel">Bedrooms</label>
              <input
                className="formInputSmall"
                type="number"
                id="bedrooms"
                value={bedrooms}
                onChange={onMutate}
                min="1"
                max="50"
                required
              />
            </div>
            <div>
              <label className="formLabel">Bathrooms</label>
              <input
                className="formInputSmall"
                type="number"
                id="bathrooms"
                value={bathrooms}
                onChange={onMutate}
                min="1"
                max="50"
                required
              />
            </div>
          </div>

          <label className="formLabel">Parking spot</label>
          <div className="formButtons">
            <button
              className={parking ? "formButtonActive" : "formButton"}
              type="button"
              id="parking"
              value="true"
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              className={
                !parking && parking !== null ? "formButtonActive" : "formButton"
              }
              type="button"
              id="parking"
              value="false"
              onClick={onMutate}
            >
              No
            </button>
          </div>

          <label className="formLabel">Furnished</label>
          <div className="formButtons">
            <button
              className={furnished ? "formButtonActive" : "formButton"}
              type="button"
              id="furnished"
              value="true"
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              className={
                !furnished && furnished !== null
                  ? "formButtonActive"
                  : "formButton"
              }
              type="button"
              id="furnished"
              value="false"
              onClick={onMutate}
            >
              No
            </button>
          </div>

          <label className="formLabel">Address</label>
          <textarea
            className="formInputAddress"
            id="address"
            value={address}
            onChange={onMutate}
            required
          />

          {!geoLocationEnabled && (
            <div className="formLatLng flex">
              <div>
                <label className="formLabel">Latitude</label>
                <input
                  className="formInputSmall"
                  type="number"
                  id="latitude"
                  value={lat}
                  onChange={onMutate}
                  required
                />
              </div>
              <div>
                <label className="formLabel">Longitude</label>
                <input
                  className="formInputSmall"
                  type="number"
                  id="longitude"
                  value={lng}
                  onChange={onMutate}
                  required
                />
              </div>
            </div>
          )}

          <label className="formLabel">Offer</label>
          <div className="formButtons">
            <button
              className={offer ? "formButtonActive" : "formButton"}
              type="button"
              id="offer"
              value="true"
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              className={
                !offer && offer !== null ? "formButtonActive" : "formButton"
              }
              type="button"
              id="offer"
              value="false"
              onClick={onMutate}
            >
              No
            </button>
          </div>

          <label className="formLabel">Regular Price</label>
          <div className="formPriceDiv">
            <input
              className="formInputSmall"
              type="number"
              id="regularPrice"
              value={regularPrice}
              onChange={onMutate}
              min="50"
              max="750000000"
              required
            />
            {type === "rent" && <p className="formPriceText">$ / Month</p>}
          </div>

          {offer && (
            <>
              <label className="formLabel">Discounted Price</label>
              <input
                className="formInputSmall"
                type="number"
                id="discountedPrice"
                value={discountedPrice}
                onChange={onMutate}
                min="50"
                max="750000000"
                required={offer}
              />
            </>
          )}

          <label className="formLabel">Images</label>
          <p className="imagesInfo">
            The first image will be the cover (max 6).
          </p>
          <input
            className="formInputFile"
            type="file"
            id="images"
            onChange={onMutate}
            max="6"
            accept=".jpg,.png,.jpeg,.webp"
            multiple
            required
          />
          <button type="submit" className="primaryButton createListingButton">
            Update Listing
          </button>
        </form>
      </main>
    </div>
  );
};

export default EditListing;
