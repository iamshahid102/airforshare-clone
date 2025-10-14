import { useEffect, useState } from "react";
import "./TextComp.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

const TextComp = () => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "shareText", "BMYi21QnjxIHunfGMuUr");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setInputValue(docSnap.data().text);
        console.log("Document data:", docSnap.data().text);
      } else {
        console.log("No such document!");
      }
    };
    fetchData();
  }, [setInputValue]);

  const handleSaveText = async (emptyValue) => {
    const updateText = doc(db, "shareText", "BMYi21QnjxIHunfGMuUr");

    await updateDoc(updateText, {
      text: !emptyValue ? emptyValue : inputValue,
    });
  };

  return (
    <div className="text-container">
      <div>
        <h1>Text</h1>
        <textarea
          value={inputValue}
          name="type-something"
          placeholder="Type something..."
          onChange={(e) => setInputValue(e.target.value)}
        ></textarea>
      </div>
      <div className="save-clear-btn">
        <button
          className="btn"
          onClick={() => {
            setInputValue("");
            handleSaveText("");
          }}
        >
          Clear
        </button>
        <button className="btn save-btn" onClick={handleSaveText}>
          Save
        </button>
      </div>
    </div>
  );
};

export default TextComp;
