import { useState, useContext } from "react";
import { db } from "../config/firebase";
import { collection, query, where, getDoc,getDocs,doc,arrayUnion,updateDoc,setDoc,serverTimestamp} from "firebase/firestore";
// import { useAuth } from "../config/authContext"; // custom hook for logged in user
import {AppContext} from '../context/AppContext.jsx'
import {toast} from "react-toastify"

const AddFriendModal = ({ isOpen, onClose }) => {

  const [search, setSearch] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [error, setError] = useState("");
  
  const {userData, setChatData}= useContext(AppContext);
  const handleSearch = async () => {
    try {
      setError("");
      setFoundUser(null);


      // Search by name or email
      const q = query(
        collection(db, "users"),
        where("email", "==", search) // or where("email", "==", search)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("User not found!");
        return;
      }

      const user = querySnapshot.docs[0].data();
      user.id = querySnapshot.docs[0].id;


      //search garya user ra current user same ho ki nai 
      if(user.id=== userData.id){
        setError("You cannot add yourself!");
        return;
      }

      //latest chats 
      const chatSnap = await getDoc(doc(db, "chats", userData.id));
      const latestChats = chatSnap.data()?.chatsData || [];
  
      // Check if user is already added
      const alreadyAdded = latestChats.some((chat) => chat.rId === user.id);
      if(alreadyAdded){
        setError ("User already added!");
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
  
    const chatRef = collection(db,"chats");
    const messagesRef = collection(db,"messages");
  
    try {

      // Create new message
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, { createdAt: serverTimestamp(), messages: [] });
  
      // Update chatsData for both users
      await updateDoc(doc(chatRef, foundUser.id), { chatsData: arrayUnion({
        messageId: newMessageRef.id,
        lastMessage:"",
        rId: userData.id,
        rName: userData.name,
        rAvatar: userData.avatar,
        updatedAt: Date.now(),
        messageSeen:true
      }) });
  
      await updateDoc(doc(chatRef, userData.id), { chatsData: arrayUnion({
        messageId: newMessageRef.id,
        lastMessage:"",
        rId: foundUser.id,
        rName: foundUser.name,
        rAvatar: foundUser.avatar,
        updatedAt: Date.now(),
        messageSeen:true
      }) });
  
      // Update local state for sidebar
      const userChatSnap = await getDoc(doc(db, "chats", userData.id));
      const latestChats = userChatSnap.data()?.chatsData || [];
      const tempData = latestChats.map(chat => ({
        ...chat,
        userData: { name: chat.rName, avatar: chat.rAvatar, lastMessage: chat.lastMessage, timestamp: chat.updatedAt }
      }));
      setChatData(tempData);
  
      onClose(); // close modal
    } catch(err) {
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
      placeholder="Search by name or email"
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
          <p className="font-medium text-gray-700">{foundUser.name}</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
        >
          Add to Chats
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


