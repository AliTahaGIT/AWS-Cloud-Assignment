import "./AboutUs.css"

//Author: AHMED MOHAMED AHMED ABDELGADIR (TP070007)

interface Member {
  name: string
  role: string
}



function AboutUs() {
  const members: Member[] = [
    {
      name: "a",
      role: "Developer",
    },
    {
      name: "b",
      role: "Developer",
    },
    {
      name: "c",
      role: "Developer & Group Leader",
    },
    {
      name: "d",
      role: "Developer",
    },
  ]

  return (
    <div className="about-container">
      <h1>ABOUT US</h1>
      <hr className="divider" />

      <p className="description">
        We’re Group 60 from Cloud Engineering, and our project solves Problem Statement 4 by building a real-time flood alert system. Our platform uses different APIs to give the latest flood updates, helping communities and authorities stay informed and respond quickly. We’ve focused on making it reliable, easy to use, and able to handle different situations. It brings together data from various sources, has a simple interface, and can be scaled to work in many areas.
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
