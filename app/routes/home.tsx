import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import {ArrowRight, ArrowUpRight, Clock, Layers} from "lucide-react";
import Button from "../../components/ui/Button";
import Upload  from "../../components/Upload";
import {useNavigate} from "react-router";
import {useEffect, useRef, useState} from "react";
import {createProject, getProjects} from "../../lib/puter.action";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "New React Router App" },
        { name: "description", content: "Welcome to React Router!" },
    ];
}

export default function Home() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<DesignItem[]>([]);
    const isCreatingProjectRef = useRef(false);

    const handleUploadComplete = async (base64Image: string) => {
        try {
            if (isCreatingProjectRef.current) return false;
            isCreatingProjectRef.current = true;
            const newId = Date.now().toString();
            const name = `Residence ${newId}`;

            const newItem = {
                id: newId, name, sourceImage: base64Image,
                renderedImage: undefined,
                timestamp: Date.now()
            }

            console.debug("Saving new project", { id: newItem.id, name: newItem.name });
            const saved = await createProject({ item: newItem, visibility: 'private' });

            if(!saved) {
                console.error("Failed to create projects");
                return false;
            }

            console.debug("Project saved successfully", { id: saved.id });
            setProjects((prev) => [saved, ...prev]);

            navigate(`/visualizer/${newId}`, {
                state: {
                    initialImage: saved.sourceImage,
                    initialRendered: saved.renderedImage || null,
                    name
                }
            });

            return true;
        } finally {
            isCreatingProjectRef.current = false;
        }
    }

    useEffect(() => {
        const fetchProjects = async () => {
            const items = await getProjects();
            setProjects(items);
        };

        fetchProjects();
    }, []);

    return (
        <div className="home">
            <Navbar />

            <section className="hero">
                <div className="announce">
                    <div className="dot">
                        <div className="pulse"></div>
                    </div>

                    <p>Introducing Heydix 2.6</p>
                </div>

                <h1>Build more, in less time. it stops being complex and becomes natural: fast, smart and frictionless , With Heydix</h1>

                <p className="subtitle">Heydix transforms architectural design with AI, allowing you to visualize, render and deliver projects faster, accurately and effortlessly.</p>

                <div className="actions">
                    <a href="#upload" className="cta">
                        Start Building <ArrowRight
                        className="icon" />
                    </a>

                    <Button variant="outline" size="lg" className="demo">Watch Demo</Button>
                </div>

                <div id="upload" className="upload-shell">
                    <div className="grid-overlay" />

                    <div className="upload-card">
                        <div className="upload-head">
                            <div className="upload-icon">
                                <Layers className="icon" />
                            </div>

                            <h3>Upload your floor plan</h3>
                            <p>Supports JPG, PNG, formats up to 10MB</p>
                        </div>

                        <Upload onComplete={handleUploadComplete} />
                    </div>
                </div>
            </section>

            <section className="projects">
                <div className="section-inner">
                    <div className="section-head">
                        <div className="copy">
                            <h2>Projects</h2>
                            <p>Your creations and the inspiration of the community, together in one place.</p>
                        </div>
                    </div>

                    <div className="projects-grid">
                        {projects.map((project, index) => {
                            const {id, name, renderedImage, sourceImage, timestamp} = project;
                            const key = id || (timestamp && name ? `project-${timestamp}-${name}` : `project-fallback-${index}`);
                            return (
                                <div
                                    key={key}
                                    className="project-card group"
                                    onClick={() => {
                                        if (id) {
                                            navigate(`/visualizer/${id}`);
                                        }
                                    }}
                                >
                                    <div className="preview">
                                        <img
                                            src={renderedImage || sourceImage}
                                            alt="Project"/>

                                        <div className="badge">
                                            <span>Community</span>
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        <div>
                                            <h3>{name}</h3>

                                            <div className="meta">
                                                <Clock size={12}/>
                                                <span>{timestamp ? new Date(timestamp).toLocaleDateString() : 'Unknown date'}</span>
                                                <span>By devs</span>
                                            </div>
                                        </div>
                                        <div className="arrow">
                                            <ArrowUpRight size={18}/>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    )
}