import agentSense from "./meta-plugins/agent-sense";
import { metaPlugin } from "./types";

(function() {
  const plugins = [agentSense];
  for (const plugin of plugins) {
    const { watch, onMounted, onBeforeUnmount, onUnmounted } = plugin();
    if (onMounted) {
      metaPlugin.onMounted.tap(onMounted);
    }

    if (watch) {
      metaPlugin.watch.tap(watch);
    }

    if (onBeforeUnmount) {
      metaPlugin.onBeforeUnmount.tap(onBeforeUnmount);
    }

    if (onUnmounted) {
      metaPlugin.onUnmounted.tap(onUnmounted);
    }
  }
})();