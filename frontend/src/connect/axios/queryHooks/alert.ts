import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { $ } from "../setting";

interface Alert {
  alertSeq: number;
  // 이거 필요없음
  userSeq: number;
  alertTitle: string;
  // 이거 필요없음
  alertContent: string;
  alertCreatedAt: string;
  alertIsRead: boolean;
}

// 알람 list를 받아오기
export function getAlertList(pageNum: number) {
  async function fetchAlertList(): Promise<Alert[]> {
    const { data } = await $.get("/alert/1?page=0&content=");
    return data;
  }
  const { data, isLoading } = useQuery(
    ["AlertListUser", pageNum],
    fetchAlertList
  );
  return { data, isLoading };
}

// 알람을 읽었다고 optimistic update
export function temp(pageNum: any, alertSeq: any) {
  const queryClient = useQueryClient();

  async function fetchAlert() {
    const { data } = await $.patch(`/alert`, {
      alertSeq: alertSeq,
      alertRead: true,
    });
    return data;
  }

  const { mutate: readAlert } = useMutation(fetchAlert, {
    onMutate: async () => {
      await queryClient.cancelQueries(["AlertListUser", pageNum]);

      const oldData: Alert[] | undefined = queryClient.getQueryData([
        "AlertListUser",
        pageNum,
      ]);

      queryClient.setQueryData(["AlertListUser", pageNum], (oldData: any) => {
        const newData = [...oldData];

        newData.forEach((content) => {
          if (content.alertSeq === alertSeq) {
            content.alertIsRead = true;
            return;
          }
        });

        return newData;
      });
      return { oldData };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(["AlertListUser", pageNum], context?.oldData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(["AlertListUser", pageNum]);
    },
  });

  return readAlert;
}
