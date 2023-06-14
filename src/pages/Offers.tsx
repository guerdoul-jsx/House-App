import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";

import ListingItem from "../components/ListingItem";

interface geolocationInterface {
  lat: number;
  lng: number;
}

export interface ListingDataType {
  name: string;
  type: string;
  userRef: string;
  bedrooms: number;
  bathrooms: number;
  parking: boolean;
  furnished: boolean;
  offer: boolean;
  regularPrice: number;
  discountedPrice: number;
  location: string;
  geolocation: geolocationInterface;
  imgUrls: string[];
  timestamp: string;
}

interface ListingType {
  id: string;
  data: ListingDataType;
}

const Offers = () => {
  const [listings, setListings] = useState<ListingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchedListing, setLastFetchedListing] =
    useState<QueryDocumentSnapshot<DocumentData>>();

  const params = useParams();

  useEffect(() => {
    const fetchLostings = async () => {
      try {
        // get reference
        const listingsRef = collection(db, "listings");

        //create a Query
        const q = query(
          listingsRef,
          where("offer", "==", true),
          orderBy("timestamp", "desc"),
          limit(2)
        );

        // execute  query
        const querySnap = await getDocs(q);

        const lastVisibile = querySnap.docs[querySnap.docs.length - 1];

        setLastFetchedListing(lastVisibile);

        const ListListing: ListingType[] = [];

        querySnap.forEach((doc) => {
          return ListListing.push({
            id: doc.id,
            data: doc.data() as ListingDataType,
          });
        });

        setListings(ListListing);
        setLoading(false);
      } catch (error) {
        toast.error("Could Not Fetch Listing");
      }
    };
    fetchLostings();
  }, []);

  const onFetchMoreListings = async () => {
    try {
      setLoading(true);
      // get reference
      const listingsRef = collection(db, "listings");

      //create a Query
      const q = query(
        listingsRef,
        where("offer", "==", true),
        orderBy("timestamp", "desc"),
        startAfter(lastFetchedListing),
        limit(10)
      );

      // execute  query
      const querySnap = await getDocs(q);

      const lastVisibile = querySnap.docs[querySnap.docs.length - 1];

      setLastFetchedListing(lastVisibile);

      const ListListing: ListingType[] = [];

      querySnap.forEach((doc) => {
        return ListListing.push({
          id: doc.id,
          data: doc.data() as ListingDataType,
        });
      });

      setListings([...listings, ...ListListing]);
      setLoading(false);
    } catch (error) {
      toast.error("Could Not Fetch Listing");
    }
  };

  return (
    <div className="category">
      <header>Offers</header>
      {loading ? (
        <Spinner />
      ) : listings && listings.length > 0 ? (
        <>
          <main>
            <ul className="categoryListings">
              {listings.map((listing) => (
                <ListingItem
                  listing={listing.data}
                  id={listing.id}
                  key={listing.id}
                />
              ))}
            </ul>
          </main>
          {lastFetchedListing && (
            <p className="loadMore" onClick={onFetchMoreListings}>
              Load More
            </p>
          )}
        </>
      ) : (
        <p>No Offers Available At This Time</p>
      )}
    </div>
  );
};

export default Offers;
