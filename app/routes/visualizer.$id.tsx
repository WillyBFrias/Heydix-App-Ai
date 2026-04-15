import { useParams } from "react-router";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";

const VisualizerId = () => {
    const { id } = useParams();
    const [image, setImage] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const storedImage = localStorage.getItem(id);
            if (storedImage) {
                setImage(storedImage);
            }
        }
    }, [id]);

    return (
        <div className="visualizer-page">
            <Navbar />
            <div className="content">
                {image ? (
                    <img src={image} alt="Uploaded Floor Plan" style={{ maxWidth: "100%", height: "auto" }} />
                ) : (
                    <p>Loading image...</p>
                )}
            </div>
        </div>
    );
};

export default VisualizerId;