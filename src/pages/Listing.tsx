import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Marker, MapContainer, TileLayer, Popup } from "react-leaflet";

import { getAuth } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import Spinner from "../components/Spinner";
import { db } from "../firebase.config";
import shareIcon from "../assets/svg/shareIcon.svg";

// ?! Start Swiper //
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// import required modules
import { Navigation, Pagination } from "swiper";
//  ?! End Swiper //

interface timesT {
  seconds: number;
  nanoseconds: number;
}

export interface Listing {
  parking: boolean;
  type: string;
  discountedPrice: number;
  regularPrice: number;
  offer: boolean;
  name: string;
  location: string;
  bedrooms: number;
  timestamp: timesT;
  bathrooms: number;
  geolocation: {
    lng: number;
    lat: number;
  };
  userRef: string;
  imgUrls: string[];
  furnished: boolean;
}

const ListingProps: Listing = {
  parking: true,
  type: "",
  discountedPrice: 0,
  regularPrice: 0,
  offer: true,
  name: "",
  location: "",
  bedrooms: 0,
  timestamp: {
    seconds: 0,
    nanoseconds: 0,
  },
  bathrooms: 0,
  geolocation: {
    lng: 0,
    lat: 0,
  },
  userRef: "",
  imgUrls: [],
  furnished: true,
};

const Listing = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listing, setListing] = useState(ListingProps);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  const navigate = useNavigate();
  const { listingId, categoryName } = useParams();
  const auth = getAuth();

  useEffect(() => {
    const fetchListing = async () => {
      const docRef = doc(db, "listings", listingId as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setListing(docSnap.data() as Listing);
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [navigate, listingId, categoryName]);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <main>
      <Swiper
        navigation={true}
        modules={[Navigation, Pagination]}
        spaceBetween={30}
        pagination={{ clickable: true }}
        className="mySwiper"
      >
        {listing.imgUrls.map((url, idx) => (
          <SwiperSlide key={idx}>
            <div
              className="swiper-slide"
              key={idx}
              style={{
                background: `url(${listing.imgUrls[idx]}) center no-repeat`,
                backgroundSize: "cover",
                minHeight: "480px",
              }}
            ></div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div
        className="shareIconDiv"
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          setShareLinkCopied(true);
          setTimeout(() => {
            setShareLinkCopied(false);
          }, 2000);
        }}
      >
        <img src={shareIcon} alt="Share" />
      </div>
      {shareLinkCopied && <p className="linkCopied">Link Copied!</p>}
      <div className="listingDetails">
        <p className="listingName">
          {listing.name} - $
          {listing.offer
            ? listing.discountedPrice
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            : listing.regularPrice
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </p>
        <p className="listingLocation">{listing.location}</p>
        <p className="listingType">
          For {listing.type === "rent" ? "Rent" : "Sale"}
        </p>
        {listing.offer && (
          <p className="discountPrice">
            ${listing.regularPrice - listing.discountedPrice} discount
          </p>
        )}

        <ul className="listingDetailsList">
          <li>
            {listing.bedrooms > 1
              ? `${listing.bedrooms} Bedrooms`
              : "1 Bedroom"}
          </li>
          <li>
            {listing.bathrooms > 1
              ? `${listing.bathrooms} Bathrooms`
              : "1 Bathroom"}
          </li>
          <li>{listing.parking && "Parking Spot"}</li>
          <li>{listing.furnished && "Furnished"}</li>
        </ul>

        <p className="listingLocationTitle">Location</p>

        <div className="leafletContainer">
          <MapContainer
            style={{ height: "100%", width: "100%" }}
            center={[listing.geolocation.lat, listing.geolocation.lng]}
            zoom={13}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={[listing.geolocation.lat, listing.geolocation.lng]}
            >
              <Popup>{listing.location}</Popup>
            </Marker>
          </MapContainer>
        </div>

        {auth.currentUser?.uid !== listing.userRef && (
          <Link
            to={`/contact/${listing.userRef}?listingName=${listing.name}`}
            className="primaryButton"
          >
            Contact Landlord
          </Link>
        )}
      </div>
    </main>
  );
};

export default Listing;
