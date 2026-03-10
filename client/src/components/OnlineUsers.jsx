export default function OnlineUsers({ users }) {
  if (!users || users.length === 0) return null;

  const colors = ['#e94560', '#4361ee', '#38b000', '#f77f00', '#9b5de5', '#00b4d8'];

  return (
    <div className="flex items-center -space-x-2">
      {users.slice(0, 5).map((user, i) => (
        <div
          key={user._id || i}
          title={user.name}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
          style={{ backgroundColor: colors[i % colors.length], zIndex: users.length - i }}
        >
          {user.name?.charAt(0).toUpperCase() || '?'}
        </div>
      ))}
      {users.length > 5 && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold border-2 border-white">
          +{users.length - 5}
        </div>
      )}
      <span className="ml-3 text-xs text-gray-500">{users.length} online</span>
    </div>
  );
}
