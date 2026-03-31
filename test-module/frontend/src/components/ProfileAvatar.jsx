import {useMemo} from 'react';

function ProfileAvatar({name, size='medium'})
{
  const initials=useMemo(() =>
  {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)||'?';
  }, [name]);

  const sizeClasses={
    small: 'avatar-sm',
    medium: 'avatar-md',
    large: 'avatar-lg',
  };

  const colors=[
    'avatar-coral',
    'avatar-gold',
    'avatar-blue',
    'avatar-purple',
    'avatar-green',
    'avatar-pink',
  ];

  // Consistent color based on initials hash
  const hash=initials.charCodeAt(0) + (initials.charCodeAt(1)||0);
  const colorClass=colors[hash % colors.length];

  return (
    <div className={`profile-avatar ${sizeClasses[size]} ${colorClass}`}>
      <span className="avatar-text">{initials}</span>
    </div>
  );
}

export default ProfileAvatar;
