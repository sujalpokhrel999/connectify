import { useState, useContext } from "react";
import { db } from "../config/firebase";
import { collection, query, where, getDoc, getDocs, doc, arrayUnion, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { AppContext } from '../context/AppContext.jsx'
import { toast } from "react-toastify"

const AddFriendModal = ({ isOpen, onClose }) => {

  const [search, setSearch] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [error, setError] = useState("");
  
  const { userData, setChatData, friends, setFriends } = useContext(AppContext);
  
  const handleSearch = async () => {
    try {
      setError("");
      setFoundUser(null);

      // Search by email
      const q = query(
        collection(db, "users"),
        where("email", "==", search)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("User not found!");
        return;
      }

      const user = querySnapshot.docs[0].data();
      user.id = querySnapshot.docs[0].id;

      // Check if searched user is current user
      if (user.id === userData.id) {
        setError("You cannot add yourself!");
        return;
      }

      // Check if user is already in friends list
      const alreadyAdded = (friends || []).some((friend) => friend.id === user.id);
      if (alreadyAdded) {
        setError("User already added!");
        return;
      }

      setFoundUser(user);
    } catch (err) {
      console.error(err);
      setError("Error searching user");
    }
  };

  const handleAdd = async () => {
    if (!foundUser) return;

    const usersRef = collection(db, "users");
    try {
      // ===== NOTE: No chat creation here - this is CORRECT for Requirement 1 =====
      // We only add to friends list, not to chats
      // The chat will be created when the first message is sent

      // Add found user to current user's friends list
      await updateDoc(doc(usersRef, userData.id), {
        friends: arrayUnion({
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          avatar: foundUser.avatar,
          addedAt: Date.now()
        })
      });

      // Add current user to found user's friends list
      await updateDoc(doc(usersRef, foundUser.id), {
        friends: arrayUnion({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          addedAt: Date.now()
        })
      });

      // ✅ Instantly update local state for Friends Tab display
      setFriends((prev) => [
        ...prev,
        {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          avatar: foundUser.avatar,
          addedAt: Date.now(),
        },
      ]);

      toast.success(`${foundUser.name} added as friend!`);

      // Clear form and close modal
      setSearch("");
      setFoundUser(null);
      onClose();
    } catch (err) {
      console.error("Add friend error:", err);
      toast.error(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-80 shadow-lg flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-800 text-center">Add Friend</h2>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={handleSearch}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition"
        >
          Search
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {foundUser && (
          <div className="mt-2 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg w-full">
              <img className="w-10 h-10 rounded-full" src={foundUser.avatar} alt="" />
              <div className="flex flex-col">
                <p className="font-medium text-gray-700">{foundUser.name}</p>
                <p className="text-xs text-gray-500">{foundUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
            >
              Add to Friends
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="text-gray-500 text-sm mt-2 hover:underline self-center"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddFriendModal;