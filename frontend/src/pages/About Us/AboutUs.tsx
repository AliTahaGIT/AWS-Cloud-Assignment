import "./AboutUs.css"

interface Member {
  name: string
  role: string
}

function AboutUs() {
  const members: Member[] = [
    {
      name: "Ahmed Abdelgadir",
      role: "Developer",
    },
    {
      name: "Madraimov Abduzafar",
      role: "Developer",
    },
    {
      name: "Ali Taha",
      role: "Developer & Group Leader",
    },
    {
      name: "Amir Karim",
      role: "Developer",
    },
  ]

  return (
    <div className="about-container">
      <h1>ABOUT US</h1>
      <hr className="divider" />

      <p className="description">
        We are Group 60 in Cloud Engineering and our solution addresses Problem Statement 4: a real-time flood alerting
        platform. Our platform leverages available APIs to provide up-to-date flood information, alerting communities
        and authorities to potential risks. With a focus on reliability, accessibility, and real-time data, we aim to
        make flood response faster and more effective. Our system integrates multiple data sources, offers user-friendly
        interfaces, and is designed to scale for use in diverse environments.
      </p>

      <hr className="divider" />

      <h2 className="mission-title">OUR MISSION</h2>
      <p className="mission-description">
        Our mission is to create a comprehensive solution for flooding reports, empowering communities to respond
        quickly and efficiently to flood threats. By combining real-time data, advanced analytics, and intuitive user
        experiences, we strive to minimize the impact of floods and help save lives and property. We are committed to
        innovation, collaboration, and making a positive difference in disaster management.
      </p>

      <hr className="divider" />

      <h2 className="members-title">Members</h2>
      <div className="members">
        {members.map((member, index) => (
          <div key={index} className="member">
            <div className="member-name">{member.name}</div>
            <div className="member-role">{member.role}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AboutUs
