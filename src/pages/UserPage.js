import React from "react";
import { connect } from '../dva';

 function UserPage(props) {
  const { userlist=[],dispath } = props;
  return (
    <>
    <button onClick={()=>dispath({ type: 'users/asyncAdd' })}>添加用户</button>
      <ul>
        {userlist.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </>
  );
}

export default connect(
  state => state.users
)(UserPage);