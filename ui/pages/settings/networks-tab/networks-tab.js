import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useLocation, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ADD_POPULAR_CUSTOM_NETWORK,
  NETWORKS_FORM_ROUTE,
  DEFAULT_ROUTE,
  NETWORKS_ROUTE,
} from '../../../helpers/constants/routes';
import { setSelectedNetworkConfigurationId } from '../../../store/actions';
import Button from '../../../components/ui/button';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import {
  getNetworkConfigurations,
  getNetworksTabSelectedNetworkConfigurationId,
  getProvider,
} from '../../../selectors';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
  SHOULD_SHOW_LINEA_TESTNET_NETWORK,
  TEST_CHAINS,
} from '../../../../shared/constants/network';
import { defaultNetworksData } from './networks-tab.constants';
import NetworksTabContent from './networks-tab-content';
import NetworksForm from './networks-form';
import NetworksFormSubheader from './networks-tab-subheader';

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
  isATestNetwork: TEST_CHAINS.includes(network.chainId),
}));

const NetworksTab = ({ addNewNetwork }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const history = useHistory();

  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const shouldRenderNetworkForm =
    isFullScreen ||
    Boolean(pathname.match(NETWORKS_FORM_ROUTE)) ||
    window.location.hash.split('#')[2] === 'blockExplorerUrl';

  const networkConfigurations = useSelector(getNetworkConfigurations);
  const provider = useSelector(getProvider);
  const networksTabSelectedNetworkConfigurationId = useSelector(
    getNetworksTabSelectedNetworkConfigurationId,
  );

  const networkConfigurationsList = Object.entries(networkConfigurations)
    .map(([networkConfigurationId, networkConfiguration]) => {
      return {
        label: networkConfiguration.nickname,
        iconColor: 'var(--color-icon-alternative)',
        providerType: NETWORK_TYPES.RPC,
        rpcUrl: networkConfiguration.rpcUrl,
        chainId: networkConfiguration.chainId,
        ticker: networkConfiguration.ticker,
        blockExplorerUrl: networkConfiguration.rpcPrefs?.blockExplorerUrl || '',
        isATestNetwork: TEST_CHAINS.includes(networkConfiguration.chainId),
        networkConfigurationId,
      };
    })
    .filter((network) => network.chainId !== CHAIN_IDS.LINEA_TESTNET);

  let networksToRender = [...defaultNetworks, ...networkConfigurationsList];
  if (!SHOULD_SHOW_LINEA_TESTNET_NETWORK) {
    networksToRender = networksToRender.filter(
      (network) => network.chainId !== CHAIN_IDS.LINEA_TESTNET,
    );
  }
  let selectedNetwork =
    networksToRender.find(
      (network) =>
        network.networkConfigurationId ===
        networksTabSelectedNetworkConfigurationId,
    ) || {};
  const networkIsSelected = Boolean(selectedNetwork.rpcUrl);

  let networkDefaultedToProvider = false;
  if (!networkIsSelected) {
    selectedNetwork =
      networksToRender.find((network) => {
        return (
          network.rpcUrl === provider.rpcUrl ||
          (network.providerType !== NETWORK_TYPES.RPC &&
            network.providerType === provider.type)
        );
      }) || {};
    networkDefaultedToProvider = true;
  }

  useEffect(() => {
    return () => {
      dispatch(setSelectedNetworkConfigurationId(''));
    };
  }, [dispatch]);

  return (
    <div className="networks-tab__body">
      {isFullScreen ? (
        <NetworksFormSubheader addNewNetwork={addNewNetwork} />
      ) : null}
      <div
        className={classnames('networks-tab__content', {
          'networks-tab__content--with-networks-list-popup-footer':
            !isFullScreen && !shouldRenderNetworkForm,
        })}
      >
        {addNewNetwork ? (
          <NetworksForm
            networksToRender={networksToRender}
            addNewNetwork={addNewNetwork}
            submitCallback={() => history.push(DEFAULT_ROUTE)}
            cancelCallback={() => history.push(NETWORKS_ROUTE)}
          />
        ) : (
          <>
            <NetworksTabContent
              networkDefaultedToProvider={networkDefaultedToProvider}
              networkIsSelected={networkIsSelected}
              networksToRender={networksToRender}
              providerUrl={provider.rpcUrl}
              selectedNetwork={selectedNetwork}
              shouldRenderNetworkForm={shouldRenderNetworkForm}
            />
            {!isFullScreen && !shouldRenderNetworkForm ? (
              <div className="networks-tab__networks-list-popup-footer">
                <Button
                  type="primary"
                  onClick={() => {
                    isFullScreen
                      ? history.push(ADD_POPULAR_CUSTOM_NETWORK)
                      : global.platform.openExtensionInBrowser(
                          ADD_POPULAR_CUSTOM_NETWORK,
                        );
                  }}
                >
                  {t('addNetwork')}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

NetworksTab.propTypes = {
  addNewNetwork: PropTypes.bool,
};
export default NetworksTab;
