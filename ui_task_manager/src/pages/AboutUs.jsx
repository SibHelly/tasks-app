import React from "react";
import "./Home.css";

// Import your images (replace with actual paths)
import img1 from "../assets/Img/1.jpg";
import img2 from "../assets/Img/2.jpg";
import img3 from "../assets/Img/3.jpg";
import img4 from "../assets/Img/4.jpg";
import img5 from "../assets/Img/5.jpg";

export const AboutUs = () => {
  const features = [
    {
      id: 1,
      title: "Save Time",
      description:
        "Our platform helps you optimize your workflow and save valuable time on task management.",
      image: img1,
      reverse: false,
    },
    {
      id: 2,
      title: "Plan by Dates",
      description:
        "Easily distribute your tasks across dates with our intuitive calendar interface.",
      image: img2,
      reverse: true,
    },
    {
      id: 3,
      title: "Track Completed Tasks",
      description:
        "Mark tasks as done and visualize your progress with clear completion indicators.",
      image: img3,
      reverse: false,
    },
    {
      id: 4,
      title: "Structure Your Work",
      description:
        "Organize tasks efficiently with our powerful categorization and prioritization tools.",
      image: img4,
      reverse: true,
    },
    {
      id: 5,
      title: "Monitor & Export Results",
      description:
        "Track your productivity metrics and export reports for analysis or presentations.",
      image: img5,
      reverse: false,
    },
  ];

  return (
    <div className="board">
      <div className="header-container">
        <div className="header">
          <h3>About Our Platform</h3>
        </div>
      </div>

      <div className="header-list" style={{ flexDirection: "column" }}>
        {features.map((feature) => (
          <div
            key={feature.id}
            className={`feature-item ${feature.reverse ? "reverse" : ""}`}
            style={{
              marginBottom: "40px",
              display: "flex",
              flexDirection: feature.reverse ? "row-reverse" : "row",
              alignItems: "center",
              gap: "30px",
            }}
          >
            <div className="feature-image" style={{}}>
              <img
                src={feature.image}
                alt={feature.title}
                style={{
                  width: "300px",
                }}
              />
            </div>
            <div className="feature-content" style={{ flex: 1 }}>
              <h3 style={{ fontSize: "24px", marginBottom: "16px" }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#555" }}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
