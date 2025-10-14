import { useEffect, useRef, useState } from "react";
import "./FileComp.css";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

const FileComp = () => {
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [url, setUrl] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "shareFiles", "gZcza56jUAUrYqCWhhwo");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const documentData = docSnap.data();
        const arrayData = documentData["imagesURLs"];
        setPreview(arrayData);
      } else {
        console.log("No such document!");
      }
    };
    fetchData();
  }, [setPreview]);

  const handleSaveDatas = () => {
    if (!files.length) {
      alert("please select files first");
      return;
    }

    const data = new FormData();
    files.map(async (file) => {
      data.append("file", file);
      data.append("upload_preset", "airforshare");
      data.append("cloud_name", "dqen2s1cc");

      try {
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dqen2s1cc/image/upload",
          {
            method: "POST",
            body: data,
          }
        );

        const result = await res.json();
        setUrl((prev) => [...prev, result.secure_url]);

        const updatefiles = doc(db, "shareFiles", "gZcza56jUAUrYqCWhhwo");

        await updateDoc(updatefiles, {
          imagesURLs: arrayUnion(...url),
        });
      } catch (err) {
        console.error("Upload Error:", err);
      }
    });
  };

  const handleCheckFiles = async (e) => {
    const selected = Array.from(e.target.files);

    setFiles(selected);
    selected.map((file) =>
      setPreview((prev) => [...prev, URL.createObjectURL(file)])
    );

    console.log(preview.length);
  };

  const clearFiles = async () => {
    setFiles([]);
    setPreview([]);
    setUrl([]);
    const updatefiles = doc(db, "shareFiles", "gZcza56jUAUrYqCWhhwo");
    await updateDoc(updatefiles, {
      imagesURLs: [],
    });
  };

  return (
    <div className="file-container">
      <div>
        <h1>Files</h1>

        <div className="images-div">
          {preview &&
            preview.map((url, i) => (
              <img
                style={{ width: "100px" }}
                key={i}
                src={url}
                alt="preiew iamge"
              />
            ))}
        </div>

        <input
          onChange={handleCheckFiles}
          type="file"
          accept="image/*"
          name="upload-files"
          multiple
          className="file-input"
        />
      </div>
      <div className="save-clear-btn">
        <button className="btn" onClick={clearFiles}>
          Clear
        </button>
        <button className="btn save-btn" onClick={handleSaveDatas}>
          Save
        </button>
      </div>
    </div>
  );
};

export default FileComp;
