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

      resolveModules = resolveModules.map((m) => m.defult || m);
      AsyncComponent = AsyncComponent.defult || AsyncComponent;
      resolveModules.forEach((m) => app.model(m));
      this.setState({ AsyncComponent });
    }

    render() {
      const { AsyncComponent } = this.state;
      console.log(AsyncComponent);
      const { LoadingComponent } = this;
      return AsyncComponent ? (
        <UserPage {...this.props} />
      ) : (
        <LoadingComponent />
      );
    }
  };
}
