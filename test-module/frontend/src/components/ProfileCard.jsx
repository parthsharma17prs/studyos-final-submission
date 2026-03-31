import ProfileAvatar from './ProfileAvatar';

function ProfileCard({name, role='Student'})
{
  return (
    <div className="profile-card-mini">
      <ProfileAvatar name={name} size="medium" />
      <div className="profile-info">
        <div className="profile-name">{name||'Student'}</div>
        <div className="profile-role">{role}</div>
      </div>
    </div>
  );
}

export default ProfileCard;
