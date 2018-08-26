import React, { Component } from 'react';
import UserIco from '../img/user.svg';
import CheckmarkIco from '../img/check-mark-dark.svg';
import PhoneIco from '../img/smartphone.svg';
import BackupIco from '../img/printer.svg';
import GroupIco from '../img/users.svg';
import PropTypes from 'prop-types';

class GreetingView extends Component {
  render() {
    return (
      <div className="greeting-view">
        <div className="container">
          <div className="row">
            <img className="user-avatar" src={UserIco} alt="Avatar" />
            <div>
              <p className="user-id">{this.props.identity.name}</p>
              <p className="wallet-address">{this.props.identity.address}</p>
            </div>
          </div>
          <hr className="separator" />
          <div className="row">
            <img className="checkmark-ico" src={CheckmarkIco} alt="Checkmark" />
            <div>
              <p>You created a new account</p>
              <p>Recieved 10 clicks</p>
            </div>
          </div>
          <hr className="separator" />
          <div className="row">
            <img className="bonus-ico" src={PhoneIco} alt="Phone" />
            <div>
              <p>Add a second device to increase security</p>
              <p>
                You
                {'\''}
                ll get 5 extra clicks
              </p>
            </div>
          </div>
          <hr className="separator" />
          <div className="row">
            <img className="bonus-ico" src={BackupIco} alt="Group" />
            <div>
              <p>Save a backup code</p>
              <p>
                You
                {'\''}
                ll get 10 extra clicks
              </p>
            </div>
          </div>
          <hr className="separator" />
          <div className="row">
            <img className="bonus-ico" src={GroupIco} alt="Group" />
            <div>
              <p>Set up 5 trusted friends to recover</p>
              <p>
                You
                {'\''}
                ll get 15 extra clicks
              </p>
            </div>
          </div>
          <button className="btn fullwidth start-btn" onClick={this.props.onStartClick.bind(this)}>
            Start using App
          </button>
        </div>
      </div>
    );
  }
}

GreetingView.propTypes = {
  identity: PropTypes.object,
  onStartClick: PropTypes.func
};

export default GreetingView;
