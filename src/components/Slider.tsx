import React, { useState, useEffect } from "react";
import { db } from "../firebase.config";
import { orderBy, limit, collection, getDocs, query } from "firebase/firestore";
import Spinner from "./Spinner";

import { Listing } from "../pages/Listing";

// ?! Start Swiper //
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// import required modules
import { Navigation, Pagination } from "swiper";
import { useNavigate } from "react-router-dom";
//  ?! End Swiper //

export type SliderProps = {
  id: string;
  data: Listing;
};

const Slider = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<SliderProps[] | []>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const getListings = async () => {
      const listingRef = collection(db, "listings");
      const q = query(listingRef, orderBy("timestamp", "desc"), limit(5));

      const querySnap = await getDocs(q);

      let listingsArr: any = [];

      querySnap.forEach((doc) => {
        return listingsArr.push({
          id: doc.id,
          data: doc.data(),
        });
      });
      setIsLoading(false);
      setListings(listingsArr);
    };

    getListings();
  }, []);

  if (isLoading) {
    return <Spinner />;
  }

  if (listings.length === 0) {
    return <></>;
  }

  return (
    <>
      <p className="exploreHeading">Recommended</p>
      <Swiper
        navigation={true}
        modules={[Navigation, Pagination]}
        slidesPerView={1}
        pagination={{ clickable: true }}
        className="mySwiper"
      >
        {listings.map(({ id, data }) => (
          <SwiperSlide
            key={id}
            onClick={() => navigate(`/category/${data.type}/${id}`)}
          >
            <div
              className="swiper-slide swiperSlideDiv"
              style={{
                background: `url(${data.imgUrls[0]}) center no-repeat`,
                backgroundSize: "cover",
                minHeight: "480px",
              }}
            >
              <p className="swiperSlideText">{data.name}</p>
              <div className="swiperSlidePrice">
                ${data.discountedPrice ?? data.regularPrice}{" "}
                {data.type === "rent" && "/ month"}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
};

export default Slider;
