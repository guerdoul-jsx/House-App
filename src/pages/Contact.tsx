import { ChangeEvent, useEffect, useState } from "react";
import { getDoc, doc, FieldValue } from "firebase/firestore";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase.config";
import { toast } from "react-toastify";

type formDataCopyProps = {
  name: string;
  email: string;
  timestamp?: FieldValue;
};

const Contact = () => {
  const [message, setMessage] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [listingOwner, setListingOwner] = useState({
    name: "",
    email: "",
  });

  const { ownerId } = useParams();

  console.log();

  useEffect(() => {
    const getHouse = async () => {
      const docRef = doc(db, "users", ownerId as string);
      const docSnap = await getDoc(docRef);
      console.log(docSnap.data());

      if (docSnap.exists()) {
        setListingOwner(docSnap.data() as formDataCopyProps);
      } else {
        toast.error("Could Not Get Landbord Data");
      }
    };

    getHouse();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
    setMessage(event.target.value);

  return (
    <div className="pageContainer">
      <header>
        <p className="pageHeader">Contact Landlord</p>
      </header>
      {listingOwner !== undefined && (
        <main>
          <div className="contactLandlord">
            <p className="landlordName">Contact {listingOwner?.name}</p>
          </div>
          <form className="messageForm">
            <div className="messageDiv">
              <label className="messageLabel" htmlFor="message">
                Message
              </label>
              <textarea
                name="message"
                id="message"
                cols={30}
                rows={10}
                className="textarea"
                value={message}
                onChange={handleChange}
              ></textarea>
            </div>
            <a
              href={`mailto:${listingOwner.email}?Subject=${searchParams.get(
                "listingName"
              )}&body=${message}`}
            >
              <button className="primaryButton" type="button">
                Send Message
              </button>
            </a>
          </form>
        </main>
      )}
    </div>
  );
};

export default Contact;
