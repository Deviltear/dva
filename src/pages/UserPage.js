import React from "react";
import { connect } from '../dva';

 function UserPage(props) {
  const { userlist=[],dispatch ,loading} = props;
  console.log(props);
  return (
    <>
    <button disabled={loading} onClick={()=>dispatch({ type: 'users/asyncAdd' })}>添加用户</button>
      <ul>
        {userlist.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </>
  );
}

export default connect(
  ({users,loading}) => ({
    ...users,
    loading:loading.effects['users/asyncAdd']
  
  })
)(UserPage);