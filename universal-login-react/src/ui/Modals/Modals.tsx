import React, {useContext} from 'react';
import {ModalWrapper} from './ModalWrapper';
import {ReactModalContext, TopUpProps, ConnectionFlowProps} from '../../core/models/ReactModalContext';
import {TopUp} from '../TopUp/TopUp';
import {ConnectionFlow} from '../ConnectionFlow';

export interface ModalsProps {
  modalClassName?: string;
}

const Modals = ({modalClassName}: ModalsProps) => {
  const modalService = useContext(ReactModalContext);

  switch (modalService.modalName) {
    case 'topUpAccount':
      return (
        <TopUp
          hideModal={modalService.hideModal}
          modalClassName={modalClassName}
          {...modalService.modalProps as TopUpProps}
          isModal
        />
      );
    case 'connectionFlow':
      return (
        <ModalWrapper>
          <ConnectionFlow
            onCancel={modalService.hideModal}
            {...modalService.modalProps as ConnectionFlowProps}
          />
        </ModalWrapper>
      );
    default:
      return null;
  }
};

export default Modals;
