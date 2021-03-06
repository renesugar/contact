import React from 'react';
import {Alert} from 'react-bootstrap';
import request from 'superagent';
import {isLoggedIn, getSession, destroySession} from './util/session';
import SignUp from './components/SignUp';
import Login from './components/Login';
import NavigationBar from './components/NavigationBar';
import Home from './components/Home';
import CreateTeamModal from './components/CreateTeamModal';
import _ from 'lodash';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      route: 'login',
      loggedIn: isLoggedIn(),
      currentTeam: null, 
      teams: [],
      alert: false,
      showCreateTeamModal: false,
      reload: false,
      user: {'first-name': '', 'last-name': ''}
    };

    this.state = {...this.initialState};
  }

  componentDidMount() {
    if (this.state.loggedIn) {
      this.getUserAndTeams();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.reload || (!prevState.loggedIn && prevState.loggedIn !== this.state.loggedIn)) {
      this.getUserAndTeams();
      this.setState({reload: false});
    }
  }

  resetState = () => {
    this.setState(this.initialState);
  }

  getUserAndTeams = () => {
    request
      .get('/api/v1/users/self')
      .accept('application/vnd.api+json')
      .type('application/vnd.api+json')
      .set('authorization', `Bearer ${getSession()}`)
      .then(resp => {
        const teams = _.filter(resp.body.included, (x) => {
          const teamIds = resp.body.data.relationships.teams.data.map(t => t.id);
          return x.type === "team" && _.includes(teamIds, x.id);
        })
        .map(team => {
          return {...team.attributes, id: team.id};
        });
        const user = {...resp.body.data.attributes, id: resp.body.data.id};
        const currentTeam = teams[0];

        this.setState({
          user,
          teams,
          currentTeam
        });
      })
      .catch(err => {
        destroySession();
        this.resetState();
        this.setAlert({style: 'danger', message: 'Sorry, please log back in.'});
      });
  }

  alert = () => {
    return (
      <Alert bsStyle={this.state.alert.style}>
        {this.state.alert.message}
      </Alert>
    );
  }

  setAlert = ({style, message}) => {
    this.setState({alert: {style, message}});
    setTimeout(() => this.setState({alert: false}), 10000);
  }

  handleAuthClick = route => {
    return () => {
      this.setState({route, loggedIn: isLoggedIn()});
    }
  }

  setCurrentTeam = currentTeam => {
    return () => { 
      this.setState({currentTeam});
    }
  }

  openCreateTeamModal = () => {
    this.setState({showCreateTeamModal: true});
  } 

  route = () => {
    const noAuthRoute = this.state.route === 'login'
      ? <Login handleAuthClick={this.handleAuthClick('home')}/>
      : <SignUp setAlert={this.setAlert} handleAuthClick={this.handleAuthClick('login')}/>;
    const {user, currentTeam} = this.state;
    return isLoggedIn()
      ? <Home userName={user && user.username} userId={user && user.id} teamId={currentTeam && currentTeam.id} setAlert={this.setAlert} /> 
      : noAuthRoute;
  }

  render() {
    return (
      <div>
        <CreateTeamModal currentUser={this.state.user} setAlert={this.setAlert} close={(shouldReload) => this.setState({showCreateTeamModal: false, reload: shouldReload})} show={this.state.showCreateTeamModal}/>
        <NavigationBar
          currentTeam={this.state.currentTeam}
          setCurrentTeam={this.setCurrentTeam}
          teams={this.state.teams}
          handleAuthClick={this.handleAuthClick}
          openCreateTeamModal={this.openCreateTeamModal}
          resetState={this.resetState}
          currentUser={`${this.state.user['first-name']} ${this.state.user['last-name']}`}/>
        <div className="container">
          {this.state.alert && this.alert()}
          {this.route()}
        </div>
      </div>
    );
  }
}

export default App;
