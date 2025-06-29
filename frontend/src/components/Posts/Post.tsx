import "./Post.css"
import ThraggImage from '../../assets/thragg.avif'

interface PostProps {
  id: number
  title: string
  description: string
  date: string
  image: string
}

function Post({ id, title, description, date, image }: PostProps) {
  // Format the date to match your existing format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
    return new Date(dateString).toLocaleDateString("en-US", options)
  }

  return (
    <div className="post-card">
      <h2 className="post-title">{title}</h2>
      <div className="image-wrapper">
        <img
          src={image || ThraggImage} // Use passed image or fallback to ThraggImage
          alt={title}
          className="post-image"
        />
      </div>
      <div className="post-content">
        <p className="post-date">📅 {formatDate(date)}</p>
        <p className="post-description">{description}</p>
      </div>
    </div>
  )
}

export default Post
