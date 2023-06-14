import { useState, ChangeEvent, useEffect } from "react";
import { User, getAuth } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import {
  doc,
  updateDoc,
  where,
  collection,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase.config";
import arrowRight from "../assets/svg/keyboardArrowRightIcon.svg";
import homeIcon from "../assets/svg/homeIcon.svg";

import { toast } from "react-toastify";
import Spinner from "../components/Spinner";

import { Listing } from "./Listing";
import ListingItem from "../components/ListingItem";

type listingByUser = {
  data: Listing;
  id: string;
};

const Profile = () => {
  const auth = getAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<listingByUser[]>([]);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName,
    email: auth.currentUser?.email,
  });

  const [changeDetails, setChangeDetails] = useState(false);

  const { name, email } = formData;

  useEffect(() => {
    const fetchUserListing = async () => {
      const listingRef = collection(db, "listings");

      const q = query(
        listingRef,
        where("userRef", "==", auth.currentUser?.uid),
        orderBy("timestamp", "desc")
      );

      const querSnap = await getDocs(q);

      const listingsArr: listingByUser[] = [];

      querSnap.forEach((doc) => {
        return listingsArr.push({
          id: doc.id,
          data: doc.data() as Listing,
        });
      });
      setListings(listingsArr);
      setIsLoading(false);
    };

    fetchUserListing();
  }, [auth.currentUser?.uid]);

  const onSignOut = () => {
    auth.signOut();
    navigate("/");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevState) => ({
      ...prevState,
      [event.target.id]: event.target.value,
    }));
  };

  const handleDelete = async (listingId: string) => {
    try {
      if (window.confirm("Are you sure To delete This Lising")) {
        await deleteDoc(doc(db, "listings", listingId));
        const updateListings = listings.filter(
          (listing) => listing.id !== listingId
        );
        setListings(updateListings);
        toast.success("The listing has been deleted successfully");
      }
    } catch (error) {
      toast.error("Could Not Delete This Listing");
    }
  };

  const handleEdit = async (listingId: string) =>
    navigate(`/edit-listing/${listingId}`);

  const handleSubmit = async () => {
    try {
      if (auth.currentUser) {
        if (auth.currentUser.displayName !== name) {
          updateProfile(auth.currentUser, {
            displayName: name,
          });
        }
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          name,
        });
      }
    } catch (error) {
      toast.error("User Credential Failed To update");
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="profile">
      <header className="profileHeader">
        <p className="pageHeader">My Profile</p>
        <button type="button" className="logOut" onClick={onSignOut}>
          LogOut
        </button>
      </header>
      <main>
        <div className="profileDetailsHeader">
          <p className="personalDetailsText">Personal Details</p>
          <p
            className="changePersonalDetails"
            onClick={() => {
              changeDetails && handleSubmit();
              setChangeDetails((prevState) => !prevState);
            }}
          >
            {changeDetails ? "Done" : "Change"}
          </p>
        </div>
        <div className="profileCard">
          <form>
            <input
              type="text"
              id="name"
              className={!changeDetails ? "profileName" : "profileNameActive"}
              disabled={!changeDetails}
              value={name !== null ? name : ""}
              onChange={handleChange}
            />
            <input
              type="text"
              id="email"
              className={!changeDetails ? "profileEmail" : "profileEmailActive"}
              disabled={!changeDetails}
              value={email !== null ? email : ""}
              onChange={handleChange}
            />
          </form>
        </div>
        <Link to="/create-listing" className="createListing">
          <img src={homeIcon} alt="Home" />
          <p>Sell Or Rent Your Home</p>
          <img src={arrowRight} alt="arrow right" />
        </Link>
        {!isLoading && listings.length > 0 && (
          <>
            <p className="listingText">Your Listing</p>
            <ul style={{ padding: "8px 0" }}>
              {listings.map((listing) => (
                <ListingItem
                  key={listing.id}
                  listing={listing.data}
                  id={listing.id}
                  onDelete={handleDelete}
                  onUpdate={handleEdit}
                />
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;
