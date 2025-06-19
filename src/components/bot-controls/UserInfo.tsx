
interface UserInfoProps {
  currentUser: any;
}

const UserInfo = ({ currentUser }: UserInfoProps) => {
  if (!currentUser) return null;

  return (
    <div className="mt-4 p-3 bg-muted rounded-lg">
      <p className="text-sm">
        <span className="font-medium">Usuário conectado:</span> {currentUser.display_name || currentUser.phone_number}
      </p>
    </div>
  );
};

export default UserInfo;
