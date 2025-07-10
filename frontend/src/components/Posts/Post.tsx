import "./Post.css";
///////////// DONE BY ALI AHMED ABOUELSEOUD MOUSTAFA TAHA (TP069502) //////////////////////////////



interface PostProps {
  id: string;
  title: string;
  description: string;
  date: string;
  image: string;
  organization: string;
  S3Key: string;
  onClick?: () => void;
}

function Post({
  id,
  title,
  description,
  date,
  image,
  organization,
  S3Key,
  onClick,
}: PostProps) {
  // Format the date to match your existing format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    // Ensure safe ISO string parsing by trimming if needed
    const cleanDate = dateString.split(".")[0]; // Remove microseconds if present
    return new Date(cleanDate).toLocaleDateString("en-US", options);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="post-card" id={id} onClick={handleClick}>
      <div className="post-header">
        <h2 className="post-title">{title}</h2>
        <p className="post-organization">{organization}</p>
      </div>
      <div className="image-wrapper">
        <img
          src={image}
          alt={title}
          className="post-image"
        />
      </div>
      <div className="post-content">
        <p className="post-date">{formatDate(date)}</p>
        <p className="post-description">{description}</p>
      </div>
    </div>
  );
}

export default Post;
