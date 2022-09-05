import { Component } from "react";
import UserPage from "../pages/UserPage";
const defaultLoadingComponent = (props) => <div>loading...</div>;
export default function dynamic(config) {
  const { app, models, component } = config;

  return class extends Component {
    constructor(props) {
      super(props);
      this.LoadingComponent =
        config.LoadingComponent || defaultLoadingComponent;
      this.state = { AsyncComponent: null };
    }

    async componentDidMount() {
      let [resolveModules, AsyncComponent] = await Promise.all([
        Promise.all(models()),
        component(),
      ]);

      resolveModules = resolveModules.map((m) => m.default || m);
      AsyncComponent = AsyncComponent.default || AsyncComponent;
      resolveModules.forEach((m) => app.model(m));
      this.setState({ AsyncComponent });
    }

    render() {
      const { AsyncComponent } = this.state;
      const { LoadingComponent } = this;
      return AsyncComponent ? (
        <UserPage {...this.props} />
      ) : (
        <LoadingComponent />
      );
    }
  };
}
