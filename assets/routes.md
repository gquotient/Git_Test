/res/teams GET { vendor_admin & org_label: ALL, vendor_admin org_label: xxx, vendor\_admin or admin: local org, user: just user teams
 => set scope to check for admin's personal teams }
/res/team GET (anyone), PUT (update), DELETE (marks team as inactive), POST
/res/organizations GET (va only)
/res/organization GET (organizaiton props), PUT, DELETE

/res/users GET (all users: gotta be va)
/res/users {org_label: "DRAKER"} GET (gotta be admin)
*/res/user GET PUT (email, name)*

/res/usermgt {org_label: "DRAKER", email: "useremail"} GET POST {name:'', email: ''} PUT // resets password // DELETE

/res/userteammgt GET {"org_label": xxxx, "team_label": xxxx} POST { name: 'xxxx' } PUT // adding user to team { email: ' ' } DELETE // remove 


index_name=StagedProjects

GET /api/project/devices/:project_label 


GET /res/alarms org_label, admin